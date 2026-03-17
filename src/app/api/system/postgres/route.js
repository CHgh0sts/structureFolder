/**
 * API de gestion PostgreSQL pendant le wizard de configuration.
 *
 * GET  ?action=check          → Vérifie si PostgreSQL est installé/actif
 * POST { action: "install" }  → Installe PostgreSQL (SSE streaming)
 * POST { action: "start" }    → Démarre le service PostgreSQL
 * POST { action: "create-db" }→ Crée structureFolderDB + push Prisma schema
 * POST { action: "set-json" } → Active le mode JSON (sans PostgreSQL)
 */

import { execSync, spawn } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import { setStorageMode } from "@/lib/storage-mode";

const DB_NAME = "structureFolderDB";
const PLATFORM = process.platform; // "darwin", "linux", "win32"

// ─── Utilitaires ─────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf-8",
    timeout: 15000,
    stdio: ["pipe", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function tryRun(cmd, opts = {}) {
  try {
    return { ok: true, output: run(cmd, opts) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function getPsqlPath() {
  const candidates = [
    "psql",
    "/opt/homebrew/opt/postgresql@16/bin/psql",
    "/opt/homebrew/opt/postgresql@17/bin/psql",
    "/opt/homebrew/bin/psql",
    "/usr/local/bin/psql",
    "/usr/bin/psql",
    "/usr/local/pgsql/bin/psql",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
  ];
  for (const p of candidates) {
    const r = tryRun(`"${p}" --version`);
    if (r.ok) return p;
  }
  return null;
}

function getCreatedbPath() {
  const candidates = [
    "createdb",
    "/opt/homebrew/opt/postgresql@16/bin/createdb",
    "/opt/homebrew/opt/postgresql@17/bin/createdb",
    "/opt/homebrew/bin/createdb",
    "/usr/local/bin/createdb",
    "/usr/bin/createdb",
  ];
  for (const p of candidates) {
    const r = tryRun(`"${p}" --version`);
    if (r.ok) return p;
  }
  return null;
}

function checkPostgres() {
  const psqlPath = getPsqlPath();
  if (!psqlPath) return { installed: false, running: false };

  let version = "";
  try {
    version = run(`"${psqlPath}" --version`);
  } catch {}

  // Vérifier si le serveur répond
  const readyCheck = tryRun("pg_isready -h 127.0.0.1 -p 5432", { timeout: 3000 });
  if (readyCheck.ok) {
    return { installed: true, running: true, version, psqlPath };
  }

  // macOS : vérifier via brew services
  if (PLATFORM === "darwin") {
    const brewCheck = tryRun("brew services list 2>&1 | grep postgresql", { timeout: 5000 });
    if (brewCheck.ok && brewCheck.output.includes("started")) {
      return { installed: true, running: true, version, psqlPath };
    }
  }

  return { installed: true, running: false, version, psqlPath };
}

function hasBrew() {
  return tryRun("brew --version", { timeout: 3000 }).ok;
}

function getBrewPgVersion() {
  const r = tryRun("brew list --formula 2>/dev/null | grep postgresql", { timeout: 5000 });
  if (!r.ok) return null;
  const match = r.output.match(/postgresql@?(\d+)/);
  return match ? match[0] : "postgresql";
}

// Construire l'URL de connexion pour l'OS courant
function buildDatabaseUrl(dbName, extraUser = null) {
  const systemUser = os.userInfo().username;
  const candidates = [];

  if (PLATFORM === "darwin") {
    // Homebrew : l'utilisateur courant est superuser par défaut
    candidates.push(`postgresql://${systemUser}@127.0.0.1:5432/${dbName}`);
    candidates.push(`postgresql://postgres@127.0.0.1:5432/${dbName}`);
  } else if (PLATFORM === "linux") {
    candidates.push(`postgresql://postgres@127.0.0.1:5432/${dbName}`);
    candidates.push(`postgresql://${systemUser}@127.0.0.1:5432/${dbName}`);
  } else {
    candidates.push(`postgresql://postgres@127.0.0.1:5432/${dbName}`);
  }

  if (extraUser) candidates.unshift(`postgresql://${extraUser}@127.0.0.1:5432/${dbName}`);

  return candidates;
}

// Tester une URL de connexion
function testConnection(url) {
  const testUrl = url.replace(/\/[^/]+$/, "/postgres");
  return tryRun(`psql "${testUrl}" -c "SELECT 1" -t -A`, { timeout: 5000 });
}

// Trouver la première URL qui fonctionne
function findWorkingUrl(candidates) {
  for (const url of candidates) {
    const r = testConnection(url);
    if (r.ok) return url;
  }
  return null;
}

// Créer la base de données
function createDatabase(psqlPath, dbName, workingUrl) {
  // Tenter avec createdb d'abord
  const createdbPath = getCreatedbPath();
  if (createdbPath) {
    const r = tryRun(`"${createdbPath}" "${dbName}"`, { timeout: 10000 });
    if (r.ok) return { ok: true };
    // Vérifier si la DB existe déjà
    if (r.error?.includes("already exists")) return { ok: true, alreadyExists: true };
  }

  // Fallback via psql
  if (psqlPath && workingUrl) {
    const baseUrl = workingUrl.replace(/\/[^/]+$/, "/postgres");
    const r = tryRun(
      `"${psqlPath}" "${baseUrl}" -c "CREATE DATABASE \\"${dbName}\\""`,
      { timeout: 10000 }
    );
    if (r.ok) return { ok: true };
    if (r.error?.includes("already exists")) return { ok: true, alreadyExists: true };
    return { ok: false, error: r.error };
  }

  // Linux : essai avec sudo -u postgres
  if (PLATFORM === "linux") {
    const r = tryRun(`sudo -u postgres createdb "${dbName}"`, { timeout: 10000 });
    if (r.ok) return { ok: true };
    if (r.error?.includes("already exists")) return { ok: true, alreadyExists: true };
  }

  return { ok: false, error: "Impossible de créer la base de données" };
}

// Écrire l'URL dans .env.local
function writeEnvLocal(databaseUrl) {
  const envPath = path.join(process.cwd(), ".env.local");
  let content = "";

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
    // Remplacer ou ajouter DATABASE_URL
    if (content.includes("DATABASE_URL=")) {
      content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${databaseUrl}"`);
    } else {
      content += `\nDATABASE_URL="${databaseUrl}"\n`;
    }
  } else {
    // Générer un JWT_SECRET s'il n'existe pas
    const { randomBytes } = require("crypto");
    const jwtSecret = randomBytes(32).toString("hex");
    content = `# Généré automatiquement par File Organizer\nDATABASE_URL="${databaseUrl}"\nJWT_SECRET="${jwtSecret}"\n`;
  }

  fs.writeFileSync(envPath, content, "utf-8");
}

// Exécuter prisma db push
async function runPrismaDbPush(databaseUrl) {
  return new Promise((resolve) => {
    const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");
    const child = spawn(prismaBin, ["db", "push", "--skip-generate"], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: process.cwd(),
    });

    let output = "";
    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));
    child.on("close", (code) => {
      resolve({ ok: code === 0, output, code });
    });
    child.on("error", (e) => resolve({ ok: false, error: e.message }));

    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Timeout lors du push Prisma" });
    }, 60000);
  });
}

// ─── GET — Vérification de l'état ─────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "check";

  if (action === "check") {
    const status = checkPostgres();
    return Response.json({
      ...status,
      platform: PLATFORM,
      hasBrew: PLATFORM === "darwin" ? hasBrew() : false,
    });
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 });
}

// ─── POST — Actions (install, start, create-db, set-json) ─────

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { action } = body;

  // ── Activer le mode JSON ────────────────────────────────────
  if (action === "set-json") {
    setStorageMode("json");
    return Response.json({ ok: true, mode: "json" });
  }

  // ── Installer PostgreSQL (SSE streaming) ───────────────────
  if (action === "install") {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {}
        };

        try {
          send({ step: "start", message: "Démarrage de l'installation..." });

          if (PLATFORM === "darwin") {
            // macOS — via Homebrew
            if (!hasBrew()) {
              send({
                step: "error",
                message:
                  "Homebrew n'est pas installé. Installez-le depuis https://brew.sh puis relancez.",
                requiresAction: true,
                brewInstallUrl: "https://brew.sh",
              });
              controller.close();
              return;
            }

            send({ step: "progress", message: "Installation via Homebrew (peut prendre 2-5 min)..." });

            await new Promise((resolve) => {
              const child = spawn("brew", ["install", "postgresql@16"], {
                shell: false,
                env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: "1" },
              });

              child.stdout.on("data", (d) => {
                const line = d.toString().trim();
                if (line) send({ step: "output", message: line });
              });
              child.stderr.on("data", (d) => {
                const line = d.toString().trim();
                if (line && !line.startsWith("==>")) send({ step: "output", message: line });
              });
              child.on("close", (code) => resolve({ code }));
              child.on("error", (e) => resolve({ error: e.message }));
            });

            send({ step: "progress", message: "Démarrage du service PostgreSQL..." });

            const pgPkg = getBrewPgVersion() ?? "postgresql@16";
            const startResult = await new Promise((resolve) => {
              const child = spawn("brew", ["services", "start", pgPkg], { shell: false });
              let out = "";
              child.stdout.on("data", (d) => (out += d));
              child.stderr.on("data", (d) => (out += d));
              child.on("close", (code) => resolve({ code, output: out }));
              child.on("error", (e) => resolve({ error: e.message }));
            });

            if (startResult.error) {
              send({ step: "error", message: `Erreur démarrage : ${startResult.error}` });
              controller.close();
              return;
            }

            // Attendre que le serveur soit prêt (max 15s)
            send({ step: "progress", message: "Attente du démarrage du serveur..." });
            let ready = false;
            for (let i = 0; i < 15; i++) {
              await new Promise((r) => setTimeout(r, 1000));
              const r = tryRun("pg_isready -h 127.0.0.1 -p 5432", { timeout: 2000 });
              if (r.ok) {
                ready = true;
                break;
              }
            }

            if (!ready) {
              send({ step: "error", message: "Le serveur PostgreSQL ne répond pas. Vérifiez le service manuellement." });
              controller.close();
              return;
            }

            send({ step: "done", message: "PostgreSQL installé et démarré avec succès !" });

          } else if (PLATFORM === "linux") {
            const hasSudo = tryRun("which sudo", { timeout: 3000 }).ok;
            const aptok = hasSudo && tryRun("which apt-get", { timeout: 3000 }).ok;
            const yumok = !aptok && hasSudo && tryRun("which yum", { timeout: 3000 }).ok;

            if (!aptok && !yumok) {
              send({ step: "error", message: "Gestionnaire de paquets non supporté. Installez PostgreSQL manuellement." });
              controller.close();
              return;
            }

            const cmds = aptok
              ? ["sudo apt-get update -y", "sudo apt-get install -y postgresql postgresql-contrib", "sudo systemctl start postgresql", "sudo systemctl enable postgresql"]
              : ["sudo yum install -y postgresql-server postgresql-contrib", "sudo postgresql-setup initdb", "sudo systemctl start postgresql", "sudo systemctl enable postgresql"];

            for (const cmd of cmds) {
              send({ step: "progress", message: `Exécution : ${cmd}` });
              const r = await new Promise((resolve) => {
                const parts = cmd.split(" ");
                const child = spawn(parts[0], parts.slice(1), { shell: false });
                let out = "";
                child.stdout.on("data", (d) => (out += d));
                child.stderr.on("data", (d) => (out += d));
                child.on("close", (code) => resolve({ code, output: out }));
                child.on("error", (e) => resolve({ error: e.message }));
              });
              if (r.error || r.code !== 0) {
                send({ step: "error", message: `Erreur : ${r.output || r.error}` });
                controller.close();
                return;
              }
            }

            send({ step: "done", message: "PostgreSQL installé et démarré avec succès !" });

          } else {
            send({
              step: "manual",
              message: "Installation automatique non disponible sur Windows.",
              downloadUrl: "https://www.postgresql.org/download/windows/",
            });
          }
        } catch (err) {
          send({ step: "error", message: `Erreur inattendue : ${err.message}` });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ── Démarrer le service PostgreSQL ──────────────────────────
  if (action === "start") {
    try {
      if (PLATFORM === "darwin") {
        const pgPkg = getBrewPgVersion() ?? "postgresql@16";
        run(`brew services start ${pgPkg}`, { timeout: 10000 });
        // Attendre la disponibilité
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const r = tryRun("pg_isready -h 127.0.0.1 -p 5432", { timeout: 2000 });
          if (r.ok) return Response.json({ ok: true });
        }
        return Response.json({ ok: false, error: "Le serveur ne répond pas après démarrage" });
      } else if (PLATFORM === "linux") {
        run("sudo systemctl start postgresql", { timeout: 15000 });
        return Response.json({ ok: true });
      } else {
        run("net start postgresql-x64-16", { timeout: 10000 });
        return Response.json({ ok: true });
      }
    } catch (e) {
      return Response.json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  // ── Créer la DB + push schema Prisma ────────────────────────
  if (action === "create-db") {
    try {
      const status = checkPostgres();
      if (!status.installed) {
        return Response.json({ ok: false, error: "PostgreSQL n'est pas installé" }, { status: 400 });
      }
      if (!status.running) {
        return Response.json({ ok: false, error: "Le service PostgreSQL n'est pas démarré" }, { status: 400 });
      }

      // Trouver l'URL qui fonctionne
      const urlCandidates = buildDatabaseUrl("postgres");
      const workingBaseUrl = findWorkingUrl(urlCandidates);
      if (!workingBaseUrl && PLATFORM !== "linux") {
        return Response.json(
          { ok: false, error: "Impossible de se connecter à PostgreSQL. Vérifiez que le service est démarré." },
          { status: 500 }
        );
      }

      // Créer la base de données
      const createResult = createDatabase(status.psqlPath, DB_NAME, workingBaseUrl);
      if (!createResult.ok) {
        return Response.json({ ok: false, error: createResult.error }, { status: 500 });
      }

      // Construire l'URL finale vers structureFolderDB
      let databaseUrl = workingBaseUrl
        ? workingBaseUrl.replace(/\/[^/]+$/, `/${DB_NAME}`)
        : `postgresql://postgres@127.0.0.1:5432/${DB_NAME}`;

      // Sur Linux, si on ne peut pas se connecter directement, utiliser le user postgres
      if (PLATFORM === "linux" && !workingBaseUrl) {
        databaseUrl = `postgresql://postgres@127.0.0.1:5432/${DB_NAME}`;
      }

      // Sauvegarder l'URL dans .env.local ET storage-mode.json
      writeEnvLocal(databaseUrl);
      process.env.DATABASE_URL = databaseUrl;

      // Appliquer le schema Prisma
      const pushResult = await runPrismaDbPush(databaseUrl);
      if (!pushResult.ok) {
        return Response.json(
          { ok: false, error: `Erreur lors de l'initialisation du schéma : ${pushResult.error ?? pushResult.output}` },
          { status: 500 }
        );
      }

      // Activer le mode Prisma et sauvegarder l'URL
      setStorageMode("prisma", databaseUrl);

      return Response.json({
        ok: true,
        databaseUrl,
        dbName: DB_NAME,
        alreadyExists: createResult.alreadyExists,
        message: createResult.alreadyExists
          ? `Base de données "${DB_NAME}" déjà existante — schéma synchronisé.`
          : `Base de données "${DB_NAME}" créée et initialisée avec succès.`,
      });
    } catch (err) {
      return Response.json({ ok: false, error: err.message }, { status: 500 });
    }
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 });
}
