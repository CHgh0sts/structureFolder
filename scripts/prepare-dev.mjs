#!/usr/bin/env node
/**
 * Préparation automatique pour npm run dev.
 * - Installe les dépendances si node_modules manquant
 * - Crée .env.local avec des valeurs par défaut si absent
 * - Crée data/ et storage-mode.json (mode JSON par défaut)
 * - Lance prisma generate
 *
 * Usage: node scripts/prepare-dev.mjs
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");

function ensureEnv() {
  const envPath = path.join(projectDir, ".env.local");
  if (fs.existsSync(envPath)) return;

  const defaultEnv = `# Configuration pour File Organizer (mode JSON par défaut)
# Pour utiliser PostgreSQL, configurez DATABASE_URL et lancez le setup

DATABASE_URL="postgresql://postgres:password@localhost:5432/file_organizer"
JWT_SECRET="file-organizer-dev-secret-change-in-prod"
`;

  fs.writeFileSync(envPath, defaultEnv, "utf-8");
  console.log("  ✓ .env.local créé avec des valeurs par défaut");
}

function ensureDataDir() {
  const dataDir = path.join(projectDir, "data");
  const modeFile = path.join(dataDir, "storage-mode.json");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("  ✓ Dossier data/ créé");
  }

  if (!fs.existsSync(modeFile)) {
    fs.writeFileSync(
      modeFile,
      JSON.stringify({ mode: "json" }, null, 2),
      "utf-8"
    );
    console.log("  ✓ Mode storage JSON défini par défaut (sans PostgreSQL)");
  }
}

function ensureDeps() {
  const nodeModules = path.join(projectDir, "node_modules");
  if (fs.existsSync(nodeModules)) return;

  console.log("\n  → Installation des dépendances...");
  const r = spawnSync("npm", ["install"], {
    cwd: projectDir,
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) process.exit(1);
}

function runPrismaGenerate() {
  const nodeModules = path.join(projectDir, "node_modules");
  if (!fs.existsSync(nodeModules)) return;

  const r = spawnSync("npx", ["prisma", "generate"], {
    cwd: projectDir,
    stdio: "inherit",
    shell: true,  // Nécessaire sur Windows pour trouver npx
  });
  if (r.status !== 0) process.exit(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────

console.log("\n📦 File Organizer — Préparation du développement\n");

ensureEnv();   // Avant npm install pour que prisma generate (postinstall) ait DATABASE_URL
ensureDataDir();
ensureDeps();
runPrismaGenerate();

console.log("\n✓ Prêt ! Démarrage du serveur...\n");
