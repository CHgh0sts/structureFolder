#!/usr/bin/env node
/**
 * Désactive le lancement automatique de File Organizer au démarrage.
 *
 * Usage: node scripts/disable-startup.js
 *        npm run disable-startup
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");
const platform = process.platform;

console.log(`\n📂 File Organizer - Désactivation du démarrage automatique`);
console.log(`   Plateforme : ${platform}\n`);

async function disableStartup() {
  if (platform === "win32") {
    disableWindows();
  } else if (platform === "darwin") {
    disableMac();
  } else {
    disableLinux();
  }
}

// ─── WINDOWS ─────────────────────────────────────────────────────────────────
function disableWindows() {
  const taskName = "FileOrganizerAutoStart";
  const vbsPath = path.join(projectDir, "scripts", "_launcher.vbs");

  try {
    execSync(`schtasks /delete /tn "${taskName}" /f`, { stdio: "pipe" });
    console.log(`✓ Tâche planifiée supprimée : ${taskName}`);
  } catch {
    console.log(`  Tâche planifiée non trouvée (déjà supprimée ?)`);
  }

  if (fs.existsSync(vbsPath)) {
    fs.unlinkSync(vbsPath);
    console.log(`✓ Script VBS supprimé : ${vbsPath}`);
  }

  console.log(`\n  File Organizer ne démarrera plus automatiquement.`);
}

// ─── MACOS ───────────────────────────────────────────────────────────────────
function disableMac() {
  const plistPath = path.join(
    os.homedir(),
    "Library",
    "LaunchAgents",
    "com.fileorganizer.plist"
  );

  if (fs.existsSync(plistPath)) {
    try {
      execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`, { shell: true });
      console.log(`✓ LaunchAgent déchargé`);
    } catch {}
    fs.unlinkSync(plistPath);
    console.log(`✓ LaunchAgent supprimé : ${plistPath}`);
  } else {
    console.log(`  LaunchAgent non trouvé (déjà supprimé ?)`);
  }

  console.log(`\n  File Organizer ne démarrera plus automatiquement.`);
}

// ─── LINUX ───────────────────────────────────────────────────────────────────
function disableLinux() {
  const servicePath = path.join(
    os.homedir(),
    ".config",
    "systemd",
    "user",
    "file-organizer.service"
  );

  const xdgPath = path.join(
    os.homedir(),
    ".config",
    "autostart",
    "file-organizer.desktop"
  );

  // Désactiver le service systemd
  if (fs.existsSync(servicePath)) {
    try {
      execSync("systemctl --user stop file-organizer.service 2>/dev/null || true", { shell: true });
      execSync("systemctl --user disable file-organizer.service 2>/dev/null || true", { shell: true });
      console.log(`✓ Service systemd désactivé`);
    } catch {}
    fs.unlinkSync(servicePath);
    try {
      execSync("systemctl --user daemon-reload", { stdio: "pipe" });
    } catch {}
    console.log(`✓ Fichier service supprimé : ${servicePath}`);
  } else {
    console.log(`  Service systemd non trouvé`);
  }

  // Supprimer l'entrée XDG si présente
  if (fs.existsSync(xdgPath)) {
    fs.unlinkSync(xdgPath);
    console.log(`✓ Entrée autostart XDG supprimée : ${xdgPath}`);
  }

  console.log(`\n  File Organizer ne démarrera plus automatiquement.`);
}

disableStartup().catch(console.error);
