import chokidar from "chokidar";
import path from "path";
import { getAppConfig, getRules, appendLog, isFileProcessed, markFileProcessed } from "./config.js";
import { processFile } from "./rules-engine.js";

let watcherInstance = null;
let isRunning = false;
let watchedFolders = [];

export function getWatcherStatus() {
  return { running: isRunning, watchedFolders };
}

/**
 * Construit la fonction ignored pour chokidar.
 * Ignore les fichiers/dossiers cachés + les dossiers exclus.
 */
function buildIgnored(excludedFolders = []) {
  return (filePath) => {
    // Fichiers/dossiers cachés (commencent par .)
    if (/(^|[/\\])\./.test(filePath)) return true;
    // Dossiers explicitement exclus
    if (excludedFolders.length > 0) {
      const normalized = path.normalize(filePath);
      for (const exc of excludedFolders) {
        const normalizedExc = path.normalize(exc);
        if (normalized === normalizedExc || normalized.startsWith(normalizedExc + path.sep)) {
          return true;
        }
      }
    }
    return false;
  };
}

export async function startWatcher() {
  if (isRunning && watcherInstance) {
    return { success: false, reason: "already_running" };
  }

  const config = await getAppConfig();
  if (!config || !config.watchFolders || config.watchFolders.length === 0) {
    return { success: false, reason: "no_folders_configured" };
  }

  watchedFolders = config.watchFolders;
  const recursive = config.recursive ?? false;
  const excludedFolders = config.excludedFolders ?? [];

  watcherInstance = chokidar.watch(watchedFolders, {
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 100 },
    ignored: buildIgnored(excludedFolders),
    // depth undefined = récursif illimité, 0 = racine seulement
    depth: recursive ? undefined : 0,
  });

  watcherInstance.on("add", async (filePath) => {
    const normalized = path.normalize(filePath);

    const already = await isFileProcessed(normalized);
    if (already) return;

    await appendLog({ type: "info", file: normalized, message: `Nouveau fichier détecté : ${path.basename(normalized)}` });

    const [currentConfig, rules] = await Promise.all([getAppConfig(), getRules()]);
    if (!currentConfig) return;

    const result = await processFile(normalized, rules, currentConfig.defaultDestination);

    if (result.success) {
      await markFileProcessed(normalized);
    }
  });

  watcherInstance.on("error", async (error) => {
    await appendLog({ type: "error", file: "", message: `Erreur watcher : ${error.message}` });
  });

  watcherInstance.on("ready", async () => {
    const mode = recursive ? "récursif" : "racine uniquement";
    await appendLog({ type: "info", file: "", message: `Surveillance démarrée (${mode}) → ${watchedFolders.join(", ")}` });
  });

  isRunning = true;
  return { success: true, watchedFolders };
}

export async function stopWatcher() {
  if (!isRunning || !watcherInstance) {
    return { success: false, reason: "not_running" };
  }

  await watcherInstance.close();
  watcherInstance = null;
  isRunning = false;
  watchedFolders = [];

  await appendLog({ type: "info", file: "", message: "Surveillance arrêtée" });
  return { success: true };
}

export async function restartWatcher() {
  if (isRunning) await stopWatcher();
  return startWatcher();
}

/**
 * Scan récursif d'un dossier en respectant les exclusions.
 */
async function scanFolderRecursive(folder, rules, config, stats) {
  const { default: fs } = await import("fs");
  let entries;
  try {
    entries = fs.readdirSync(folder);
  } catch (err) {
    await appendLog({ type: "error", file: folder, message: `Erreur lecture dossier : ${err.message}` });
    stats.errors++;
    return;
  }

  for (const entry of entries) {
    // Ignorer les éléments cachés
    if (entry.startsWith(".")) continue;

    const filePath = path.join(folder, entry);
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      if (!config.recursive) continue;

      // Vérifier si ce dossier est exclu
      const normalizedPath = path.normalize(filePath);
      const isExcluded = (config.excludedFolders ?? []).some((exc) => {
        const normalizedExc = path.normalize(exc);
        return normalizedPath === normalizedExc || normalizedPath.startsWith(normalizedExc + path.sep);
      });
      if (isExcluded) continue;

      await scanFolderRecursive(filePath, rules, config, stats);
    } else if (stat.isFile()) {
      const already = await isFileProcessed(filePath);
      if (already) continue;

      const result = await processFile(filePath, rules, config.defaultDestination);
      if (result.success) {
        await markFileProcessed(filePath);
        stats.processed++;
      } else if (result.reason !== "already_processed") {
        stats.errors++;
      }
    }
  }
}

/**
 * Traite tous les fichiers existants dans les dossiers surveillés
 * qui n'ont pas encore été traités.
 */
export async function processExistingFiles() {
  const config = await getAppConfig();
  if (!config || !config.watchFolders) return { processed: 0, errors: 0 };

  const rules = await getRules();
  const stats = { processed: 0, errors: 0 };

  for (const folder of config.watchFolders) {
    await scanFolderRecursive(folder, rules, config, stats);
  }

  return stats;
}
