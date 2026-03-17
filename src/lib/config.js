/**
 * Routeur de stockage : délègue vers config-prisma.js (PostgreSQL)
 * ou config-json.js (fichiers locaux) selon le mode configuré.
 *
 * Le mode est défini dans data/storage-mode.json et peut changer
 * à chaque démarrage de l'app sans redémarrage nécessaire.
 */

import { getStorageMode } from "./storage-mode.js";

let _backend = null;
let _loadedMode = null;

async function backend() {
  const mode = getStorageMode();
  // Recharger si le mode a changé (ex. après configuration)
  if (_backend && _loadedMode === mode) return _backend;

  if (mode === "prisma") {
    _backend = await import("./config-prisma.js");
  } else {
    _backend = await import("./config-json.js");
  }
  _loadedMode = mode;
  return _backend;
}

// ─── Proxy de toutes les fonctions ────────────────────────────

export async function getAppConfig() {
  return (await backend()).getAppConfig();
}
export async function isInitialized() {
  return (await backend()).isInitialized();
}
export async function initializeApp(opts) {
  return (await backend()).initializeApp(opts);
}
export async function updateAppConfig(data) {
  return (await backend()).updateAppConfig(data);
}
export async function getUserByUsername(username) {
  return (await backend()).getUserByUsername(username);
}
export async function updateUserPassword(username, hashedPassword) {
  return (await backend()).updateUserPassword(username, hashedPassword);
}
export async function getRules() {
  return (await backend()).getRules();
}
export async function createRule(data) {
  return (await backend()).createRule(data);
}
export async function updateRule(id, data) {
  return (await backend()).updateRule(id, data);
}
export async function updateAllRules(rules) {
  return (await backend()).updateAllRules(rules);
}
export async function deleteRule(id) {
  return (await backend()).deleteRule(id);
}
export async function appendLog(entry) {
  return (await backend()).appendLog(entry);
}
export async function getLogs(limit) {
  return (await backend()).getLogs(limit);
}
export async function clearLogs() {
  return (await backend()).clearLogs();
}
export async function isFileProcessed(filePath) {
  return (await backend()).isFileProcessed(filePath);
}
export async function markFileProcessed(filePath) {
  return (await backend()).markFileProcessed(filePath);
}
export async function getProcessedFilesCount() {
  return (await backend()).getProcessedFilesCount();
}
export async function clearProcessedFiles() {
  return (await backend()).clearProcessedFiles();
}
