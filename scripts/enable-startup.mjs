#!/usr/bin/env node
/**
 * Active le lancement automatique de File Organizer au démarrage du PC.
 * Lance l'application en arrière-plan sans console visible.
 * Utilise scripts/launcher.mjs --notify pour la détection de port automatique
 * et les notifications système.
 *
 * Usage: node scripts/enable-startup.mjs
 *        npm run enable-startup
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const platform   = process.platform;
const nodePath   = process.execPath;
const launcherBin = path.join(projectDir, "scripts", "launcher.mjs");

console.log(`\n📂 File Organizer — Activation du démarrage automatique`);
console.log(`   Plateforme  : ${platform}`);
console.log(`   Dossier     : ${projectDir}`);
console.log(`   Launcher    : ${launcherBin}`);
console.log(`   Port défaut : 1830 (suivant disponible si occupé)\n`);

async function enableStartup() {
  if (platform === "win32")       await enableWindows();
  else if (platform === "darwin") await enableMac();
  else                            await enableLinux();
}

// ─── WINDOWS ──────────────────────────────────────────────────────────────────
async function enableWindows() {
  const taskName = "FileOrganizerAutoStart";
  const vbsPath  = path.join(projectDir, "scripts", "_launcher.vbs");

  // Script VBS : lance le launcher Node.js sans fenêtre de console
  // --notify active les popups Windows si le port change
  const cmd = `"${nodePath.replace(/\\/g, "\\\\")}" "${launcherBin.replace(/\\/g, "\\\\")}" start --notify`;
  const vbs = `
Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = "${projectDir.replace(/\\/g, "\\\\")}"
objShell.Run "${cmd}", 0, False
`.trim();

  fs.writeFileSync(vbsPath, vbs, "utf-8");

  // Supprimer une tâche planifiée existante
  try { execSync(`schtasks /delete /tn "${taskName}" /f`, { stdio: "pipe" }); } catch {}

  // Créer la tâche planifiée au login
  const schtask = `schtasks /create /tn "${taskName}" /tr "wscript.exe \\"${vbsPath}\\"" /sc ONLOGON /rl HIGHEST /f`;
  try {
    execSync(schtask, { stdio: "pipe" });
    console.log(`✓ Tâche planifiée Windows créée : ${taskName}`);
    console.log(`  Script  : ${vbsPath}`);
    console.log(`\n  File Organizer démarrera automatiquement à chaque connexion.`);
    console.log(`  Port    : 1830 (ou 1831+ si occupé — notification popup automatique)`);
    console.log(`  Log     : ${path.join(projectDir, "data", "launcher.log")}`);
  } catch (err) {
    console.error("✕ Erreur lors de la création de la tâche planifiée :");
    console.error("  Essayez d'exécuter en tant qu'administrateur.");
    console.error(err.message);
  }
}

// ─── MACOS ────────────────────────────────────────────────────────────────────
async function enableMac() {
  const launchAgentsDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath       = path.join(launchAgentsDir, "com.fileorganizer.plist");
  const logDir          = path.join(os.homedir(), "Library", "Logs", "FileOrganizer");

  if (!fs.existsSync(launchAgentsDir)) fs.mkdirSync(launchAgentsDir, { recursive: true });
  if (!fs.existsSync(logDir))          fs.mkdirSync(logDir, { recursive: true });

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.fileorganizer</string>

  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${launcherBin}</string>
    <string>start</string>
    <string>--notify</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${projectDir}</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <false/>

  <key>StandardOutPath</key>
  <string>${path.join(logDir, "stdout.log")}</string>

  <key>StandardErrorPath</key>
  <string>${path.join(logDir, "stderr.log")}</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${path.dirname(nodePath)}</string>
    <key>NODE_ENV</key>
    <string>production</string>
  </dict>
</dict>
</plist>`;

  fs.writeFileSync(plistPath, plist, "utf-8");

  try {
    execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`, { shell: true });
    execSync(`launchctl load "${plistPath}"`, { shell: true });
    console.log(`✓ LaunchAgent créé et chargé : ${plistPath}`);
    console.log(`  Logs système : ${logDir}/stdout.log`);
    console.log(`  Log launcher : ${path.join(projectDir, "data", "launcher.log")}`);
    console.log(`\n  File Organizer démarrera automatiquement à chaque connexion.`);
    console.log(`  Port    : 1830 (ou 1831+ si occupé — notification macOS automatique)`);
  } catch (err) {
    console.error("✕ Erreur lors du chargement du LaunchAgent :");
    console.error(err.message);
  }
}

// ─── LINUX ────────────────────────────────────────────────────────────────────
async function enableLinux() {
  const systemdUserDir = path.join(os.homedir(), ".config", "systemd", "user");
  const servicePath    = path.join(systemdUserDir, "file-organizer.service");

  if (!fs.existsSync(systemdUserDir)) fs.mkdirSync(systemdUserDir, { recursive: true });

  const service = `[Unit]
Description=File Organizer — Organisateur automatique de fichiers
After=network.target graphical-session.target
Wants=graphical-session.target

[Service]
Type=simple
WorkingDirectory=${projectDir}
ExecStart=${nodePath} ${launcherBin} start --notify
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PATH=${path.dirname(nodePath)}:/usr/local/bin:/usr/bin:/bin
Environment=DISPLAY=:0
Environment=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/%U/bus

[Install]
WantedBy=default.target
`;

  fs.writeFileSync(servicePath, service, "utf-8");

  try {
    execSync("systemctl --user daemon-reload", { stdio: "pipe" });
    execSync("systemctl --user enable file-organizer.service", { stdio: "pipe" });
    execSync("systemctl --user start file-organizer.service", { stdio: "pipe" });
    console.log(`✓ Service systemd créé : ${servicePath}`);
    console.log(`  Statut : systemctl --user status file-organizer`);
    console.log(`  Log    : ${path.join(projectDir, "data", "launcher.log")}`);
    console.log(`\n  File Organizer démarrera automatiquement à chaque connexion.`);
    console.log(`  Port   : 1830 (ou 1831+ si occupé — notification desktop automatique)`);
  } catch (err) {
    console.log("  systemd user non disponible, tentative XDG autostart...");
    enableLinuxXDG();
  }
}

function enableLinuxXDG() {
  const autostartDir = path.join(os.homedir(), ".config", "autostart");
  const desktopPath  = path.join(autostartDir, "file-organizer.desktop");

  if (!fs.existsSync(autostartDir)) fs.mkdirSync(autostartDir, { recursive: true });

  const desktop = `[Desktop Entry]
Type=Application
Name=File Organizer
Comment=Organisateur automatique de fichiers
Exec=${nodePath} ${launcherBin} start --notify
Path=${projectDir}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
`;

  fs.writeFileSync(desktopPath, desktop, "utf-8");
  console.log(`✓ Entrée autostart XDG créée : ${desktopPath}`);
  console.log(`  Log    : ${path.join(projectDir, "data", "launcher.log")}`);
  console.log(`  Port   : 1830 (ou 1831+ si occupé — notification notify-send)`);
  console.log(`  File Organizer démarrera au prochain login graphique.`);
}

enableStartup().catch(console.error);
