#!/usr/bin/env node
/**
 * Launcher intelligent pour File Organizer.
 *
 * - Démarre sur le port 8080 par défaut
 * - Si le port est occupé, tente 8081, 8082... jusqu'à 8099
 * - En mode console (npm run dev/start) : log dans le terminal
 * - En mode background (--notify) : envoie une notification système si le port a changé
 *
 * Usage :
 *   node scripts/launcher.mjs dev              → Développement (console)
 *   node scripts/launcher.mjs start            → Production (console)
 *   node scripts/launcher.mjs start --notify   → Production silencieuse + notification OS
 */

import net from "net";
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, "..");
const NODE_BIN   = process.execPath;
const NEXT_BIN   = path.join(PROJECT_DIR, "node_modules", "next", "dist", "bin", "next");
const DATA_DIR   = path.join(PROJECT_DIR, "data");
const PORT_FILE  = path.join(DATA_DIR, "app.port");
const LOG_FILE   = path.join(DATA_DIR, "launcher.log");

const DEFAULT_PORT = 8080;
const MAX_PORT     = 8099;

const rawArgs    = process.argv.slice(2);
const mode       = rawArgs.find(a => !a.startsWith("-")) ?? "start"; // dev | start
const notifyMode = rawArgs.includes("--notify");

// ─── Port detection ───────────────────────────────────────────────────────────

function isPortFree(port) {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => { srv.close(); resolve(true); });
    srv.listen(port, "127.0.0.1");
  });
}

async function findPort() {
  for (let p = DEFAULT_PORT; p <= MAX_PORT; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error(`Aucun port disponible entre ${DEFAULT_PORT} et ${MAX_PORT}`);
}

// ─── Logging ──────────────────────────────────────────────────────────────────

function ensureDataDir() {
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}

function writeLog(msg) {
  try {
    ensureDataDir();
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line, "utf-8");
  } catch {}
}

function savePort(port) {
  try {
    ensureDataDir();
    fs.writeFileSync(PORT_FILE, String(port), "utf-8");
  } catch {}
}

// ─── System notifications ─────────────────────────────────────────────────────

function sendNotification(title, message) {
  const platform = process.platform;
  try {
    if (platform === "darwin") {
      // macOS — notification centre via AppleScript
      const escaped = message.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const titleEsc = title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      execSync(
        `osascript -e 'display notification "${escaped}" with title "${titleEsc}" sound name "default"'`,
        { timeout: 4000, stdio: "pipe" }
      );
    } else if (platform === "linux") {
      // Linux — libnotify (notify-send)
      execSync(`notify-send "${title}" "${message}" --urgency=normal --icon=dialog-information`, {
        timeout: 4000, stdio: "pipe",
      });
    } else if (platform === "win32") {
      // Windows — popup WScript qui s'auto-ferme après 4 secondes
      const vbs = `
Set o = CreateObject("WScript.Shell")
o.Popup "${message}", 4, "${title}", 64
`.trim();
      const tmpVbs = path.join(DATA_DIR, "_notify.vbs");
      fs.writeFileSync(tmpVbs, vbs, "utf-8");
      spawn("wscript.exe", [tmpVbs], { detached: true, stdio: "ignore" }).unref();
    }
  } catch {
    // Notification échouée — le log fichier reste la trace de référence
  }
}

// ─── Pretty console output ────────────────────────────────────────────────────

function printBanner(port, portChanged) {
  const url = `http://localhost:${port}`;
  const isDev = mode === "dev";
  const nl = "\n";
  const hr = "─".repeat(50);

  console.log(nl + hr);
  console.log(`  📂  File Organizer — ${isDev ? "Développement" : "Production"}`);
  console.log(hr);
  if (portChanged) {
    console.log(`  ⚠   Port ${DEFAULT_PORT} occupé → port ${port} utilisé`);
  }
  console.log(`  ✓   Accès :  ${url}`);
  console.log(`  ✓   Mode  :  ${isDev ? "dev (hot-reload)" : "start (build requis)"}`);
  console.log(hr + nl);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

let port;
try {
  port = await findPort();
} catch (err) {
  const msg = err.message;
  if (notifyMode) {
    writeLog(`ERREUR port : ${msg}`);
    sendNotification("File Organizer — Erreur", msg);
  } else {
    console.error(`\n  ✕  ${msg}\n`);
  }
  process.exit(1);
}

const portChanged = port !== DEFAULT_PORT;
const url         = `http://localhost:${port}`;

// Sauvegarde du port actif (lisible par l'app et par l'utilisateur)
savePort(port);
writeLog(`Démarrage sur le port ${port} (mode=${mode}, notify=${notifyMode})`);

if (notifyMode) {
  // Mode background : notification OS uniquement si le port a changé
  if (portChanged) {
    sendNotification(
      "File Organizer",
      `Port ${DEFAULT_PORT} occupé — lancé sur le port ${port}\n${url}`
    );
    writeLog(`Notification envoyée (port changé → ${port})`);
  }
  // Sinon : démarrage silencieux, rien à signaler
} else {
  // Mode console : affichage dans le terminal
  printBanner(port, portChanged);
}

// ─── Lancer Next.js ──────────────────────────────────────────────────────────

const nextArgs = [NEXT_BIN, mode, "--port", String(port)];
const nextEnv  = {
  ...process.env,
  PORT: String(port),
  NEXT_PUBLIC_PORT: String(port),
};

const child = spawn(NODE_BIN, nextArgs, {
  cwd: PROJECT_DIR,
  stdio: notifyMode ? "pipe" : "inherit",   // pipe en background pour capturer les erreurs
  env: nextEnv,
});

// En mode background : capturer stderr pour le log fichier
if (notifyMode) {
  child.stderr?.on("data", d => writeLog(`NEXT stderr: ${d.toString().trim()}`));
  child.stdout?.on("data", d => {
    // Détecter si Next.js confirme le démarrage et notifier l'URL au premier démarrage
    const line = d.toString();
    if (line.includes("started server") || line.includes("ready")) {
      writeLog(`Serveur prêt sur ${url}`);
    }
  });
}

child.on("error", err => {
  writeLog(`Erreur spawn Next.js : ${err.message}`);
  if (notifyMode) {
    sendNotification("File Organizer — Erreur de démarrage", err.message);
  } else {
    console.error(`\n  ✕  Erreur de démarrage : ${err.message}\n`);
  }
  process.exit(1);
});

child.on("exit", code => {
  writeLog(`Processus terminé (code=${code})`);
  process.exit(code ?? 0);
});

// Propagation des signaux
["SIGTERM", "SIGINT", "SIGHUP"].forEach(sig => {
  process.on(sig, () => {
    writeLog(`Signal ${sig} reçu — arrêt`);
    child.kill(sig);
  });
});
