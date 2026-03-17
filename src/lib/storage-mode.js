/**
 * Gestion du mode de stockage : "prisma" (PostgreSQL) ou "json" (fichiers locaux).
 * La configuration est sauvegardée dans data/storage-mode.json.
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const MODE_FILE = path.join(DATA_DIR, "storage-mode.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

/** @returns {{ mode: "prisma"|"json", databaseUrl?: string } | null} */
function readModeFile() {
  try {
    if (!fs.existsSync(MODE_FILE)) return null;
    return JSON.parse(fs.readFileSync(MODE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

/** @returns {"prisma"|"json"} */
export function getStorageMode() {
  const data = readModeFile();
  return data?.mode ?? "json";
}

/** @returns {string|null} */
export function getStorageDatabaseUrl() {
  const data = readModeFile();
  return data?.databaseUrl ?? process.env.DATABASE_URL ?? null;
}

export function setStorageMode(mode, databaseUrl = null) {
  ensureDataDir();
  const payload = { mode };
  if (databaseUrl) payload.databaseUrl = databaseUrl;
  fs.writeFileSync(MODE_FILE, JSON.stringify(payload, null, 2), "utf-8");

  // Injecter immédiatement dans process.env pour le runtime courant
  if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
}

export function isInPrismaMode() {
  return getStorageMode() === "prisma";
}

export function isInJsonMode() {
  return getStorageMode() === "json";
}
