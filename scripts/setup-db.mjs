#!/usr/bin/env node
/**
 * Script de configuration de la base de données.
 * Lance `prisma db push` pour créer les tables selon le schéma.
 *
 * Usage: node scripts/setup-db.mjs
 *        npm run db:push
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, "..");

console.log("\n📦 File Organizer — Configuration de la base de données\n");

// Vérifier que .env.local existe
const envFile = path.join(projectDir, ".env.local");
const envExample = path.join(projectDir, ".env.local.example");

if (!fs.existsSync(envFile)) {
  console.log("⚠  Fichier .env.local non trouvé.");
  console.log(`   Copiez .env.local.example en .env.local et renseignez DATABASE_URL.\n`);
  console.log(`   cp ${envExample} ${envFile}\n`);
  process.exit(1);
}

// Lire la DATABASE_URL depuis .env.local
const envContent = fs.readFileSync(envFile, "utf-8");
const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*["']?(.+?)["']?\s*$/m);
if (!dbUrlMatch || !dbUrlMatch[1] || dbUrlMatch[1].includes("password@")) {
  console.log("⚠  DATABASE_URL semble non configuré dans .env.local.");
  console.log("   Éditez .env.local avec vos identifiants PostgreSQL.\n");
}

try {
  console.log("→ Génération du client Prisma...");
  execSync("node_modules/.bin/prisma generate", { cwd: projectDir, stdio: "inherit" });

  console.log("\n→ Création des tables (prisma db push)...");
  execSync("node_modules/.bin/prisma db push", { cwd: projectDir, stdio: "inherit" });

  console.log("\n✓ Base de données prête !");
  console.log("  Lancez l'application : npm start");
  console.log("  Puis ouvrez : http://localhost:3000\n");
} catch (err) {
  console.error("\n✕ Erreur lors de la configuration de la BDD :");
  console.error("  Vérifiez que PostgreSQL est lancé et que DATABASE_URL est correct.");
  process.exit(1);
}
