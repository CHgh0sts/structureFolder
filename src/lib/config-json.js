/**
 * Backend de stockage JSON (fallback local sans base de données).
 * Tous les fichiers sont dans data/.
 */

import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

const DATA = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA, "config.json");
const RULES_FILE = path.join(DATA, "rules.json");
const LOGS_FILE = path.join(DATA, "logs.json");
const PROCESSED_FILE = path.join(DATA, "processed.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
}

function readJson(file, fallback = null) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

// ─── AppConfig ────────────────────────────────────────────────

export async function getAppConfig() {
  const cfg = readJson(CONFIG_FILE);
  if (!cfg || !cfg.initialized) return null;
  return {
    id: 1,
    siteName: cfg.siteName ?? "File Organizer",
    watchFolders: cfg.watchFolders ?? [],
    defaultDestination: cfg.defaultDestination ?? "",
    recursive: cfg.recursive ?? false,
    excludedFolders: cfg.excludedFolders ?? [],
    initialized: cfg.initialized ?? false,
    createdAt: cfg.createdAt ? new Date(cfg.createdAt) : new Date(),
    updatedAt: cfg.updatedAt ? new Date(cfg.updatedAt) : new Date(),
  };
}

export async function isInitialized() {
  const cfg = readJson(CONFIG_FILE);
  return cfg?.initialized === true;
}

export async function initializeApp({ siteName, adminUsername, adminPassword, watchFolders, defaultDestination }) {
  const cfg = {
    initialized: true,
    siteName,
    watchFolders,
    defaultDestination,
    adminUsername,
    adminPassword,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeJson(CONFIG_FILE, cfg);
  return getAppConfig();
}

export async function updateAppConfig(data) {
  const cfg = readJson(CONFIG_FILE) ?? {};
  const updated = { ...cfg, ...data, updatedAt: new Date().toISOString() };
  writeJson(CONFIG_FILE, updated);
  return getAppConfig();
}

// ─── Users ───────────────────────────────────────────────────

export async function getUserByUsername(username) {
  const cfg = readJson(CONFIG_FILE);
  if (!cfg || cfg.adminUsername !== username.toLowerCase()) return null;
  return {
    id: 1,
    username: cfg.adminUsername,
    password: cfg.adminPassword,
    role: "admin",
    createdAt: new Date(cfg.createdAt ?? Date.now()),
    updatedAt: new Date(cfg.updatedAt ?? Date.now()),
  };
}

export async function updateUserPassword(username, hashedPassword) {
  const cfg = readJson(CONFIG_FILE) ?? {};
  cfg.adminPassword = hashedPassword;
  cfg.updatedAt = new Date().toISOString();
  writeJson(CONFIG_FILE, cfg);
}

// ─── Rules ───────────────────────────────────────────────────

export async function getRules() {
  const rules = readJson(RULES_FILE, []);
  return [...rules].sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
}

export async function createRule(data) {
  const rules = readJson(RULES_FILE, []);
  const rule = {
    id: `rule-${randomBytes(6).toString("hex")}`,
    name: data.name || `Règle ${rules.length + 1}`,
    priority: data.priority ?? rules.length + 1,
    extensions: data.extensions ?? [],
    filters: data.filters ?? [],
    destination: data.destination,
    platforms: data.platforms ?? [],
    capturePatterns: data.capturePatterns ?? [],
    renameTemplate: data.renameTemplate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rules.push(rule);
  writeJson(RULES_FILE, rules);
  return rule;
}

export async function updateRule(id, data) {
  const rules = readJson(RULES_FILE, []);
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Règle non trouvée");
  rules[idx] = { ...rules[idx], ...data, updatedAt: new Date().toISOString() };
  writeJson(RULES_FILE, rules);
  return rules[idx];
}

export async function updateAllRules(newRules) {
  const mapped = newRules.map((r) => ({
    ...r,
    capturePatterns: r.capturePatterns ?? [],
    renameTemplate: r.renameTemplate || null,
    updatedAt: new Date().toISOString(),
  }));
  writeJson(RULES_FILE, mapped);
  return mapped;
}

export async function deleteRule(id) {
  const rules = readJson(RULES_FILE, []);
  writeJson(RULES_FILE, rules.filter((r) => r.id !== id));
}

// ─── Logs ─────────────────────────────────────────────────────

export async function appendLog(entry) {
  const logs = readJson(LOGS_FILE, []);
  const log = {
    id: `log-${Date.now()}-${randomBytes(3).toString("hex")}`,
    type: entry.type ?? "info",
    message: entry.message ?? "",
    file: entry.file ?? null,
    destination: entry.destination ?? null,
    rule: entry.rule ?? null,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(log);
  writeJson(LOGS_FILE, logs.slice(0, 500));
  return log;
}

export async function getLogs(limit = 500) {
  const logs = readJson(LOGS_FILE, []);
  return logs.slice(0, limit);
}

export async function clearLogs() {
  writeJson(LOGS_FILE, []);
}

// ─── Processed files ──────────────────────────────────────────

export async function isFileProcessed(filePath) {
  const list = readJson(PROCESSED_FILE, []);
  return list.includes(path.normalize(filePath));
}

export async function markFileProcessed(filePath) {
  const list = readJson(PROCESSED_FILE, []);
  const norm = path.normalize(filePath);
  if (!list.includes(norm)) {
    list.push(norm);
    writeJson(PROCESSED_FILE, list);
  }
}

export async function getProcessedFilesCount() {
  return readJson(PROCESSED_FILE, []).length;
}

export async function clearProcessedFiles() {
  writeJson(PROCESSED_FILE, []);
}
