import path from "path";
import fs from "fs";
import { appendLog } from "./config.js";

/* ─── Template helpers ──────────────────────────────────────── */

/**
 * Extrait les variables (named groups) depuis un texte via une regex.
 * Retourne un objet vide en cas d'erreur ou de non-correspondance.
 */
function extractVars(text, regexStr) {
  try {
    const match = text.match(new RegExp(regexStr, "i"));
    return match?.groups ? { ...match.groups } : {};
  } catch {
    return {};
  }
}

/**
 * Applique un template de variables.
 *
 * Syntaxe supportée :
 *   {varName}         → substitution simple
 *   {varName:02}      → zéro-padded sur N chiffres   (ex: "1" → "01")
 *   {varName:upper}   → majuscules
 *   {varName:lower}   → minuscules
 *   {varName:trim}    → supprime espaces en début/fin
 *
 * Les variables inconnues sont laissées telles quelles.
 */
export function applyTemplate(template, vars) {
  return template.replace(/\{(\w+)(?::([^}]+))?\}/g, (match, name, modifier) => {
    const raw = vars[name];
    if (raw === undefined) return match;
    let str = String(raw).trim();
    if (!modifier) return str;
    if (/^\d+$/.test(modifier)) return str.padStart(parseInt(modifier, 10), "0");
    if (modifier === "upper") return str.toUpperCase();
    if (modifier === "lower") return str.toLowerCase();
    if (modifier === "trim") return str.trim();
    return str;
  });
}

/**
 * Construit la map de variables pour un fichier + une règle.
 * Inclut les variables built-in et les variables extraites par les capturePatterns.
 */
export function buildVars(filePath, rule) {
  const basename   = path.basename(filePath);
  const ext        = path.extname(basename).slice(1); // sans le point
  const filename   = path.basename(basename, path.extname(basename));

  const builtins = {
    ext,        // "mp4"
    filename,   // nom sans extension
    basename,   // nom complet avec extension
  };

  const patterns = rule?.capturePatterns
    ? (Array.isArray(rule.capturePatterns)
        ? rule.capturePatterns
        : (() => { try { return JSON.parse(rule.capturePatterns); } catch { return []; } })())
    : [];

  const captureVars = patterns.reduce((acc, p) => {
    if (!p.regex) return acc;
    const source = p.source === "path" ? filePath : basename;
    const extracted = extractVars(source, p.regex);

    // Appliquer les valeurs par défaut pour les variables non capturées (ou vides)
    const defaults = p.defaults || {};
    const withDefaults = { ...defaults };
    for (const [k, v] of Object.entries(extracted)) {
      if (v !== undefined && String(v).trim() !== "") withDefaults[k] = v;
    }

    return { ...acc, ...withDefaults };
  }, {});

  return { ...builtins, ...captureVars };
}

/* ─── Rule matching ─────────────────────────────────────────── */

function matchesFilter(filename, filter) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  switch (filter.type) {
    case "filenameStartsWith":
      return filename.startsWith(filter.value) || nameWithoutExt.startsWith(filter.value);
    case "filenameEndsWith":
      return nameWithoutExt.endsWith(filter.value);
    case "filenameContains":
      return filename.includes(filter.value);
    case "filenameRegex":
      try { return new RegExp(filter.value).test(filename); } catch { return false; }
    case "extension":
      return path.extname(filename).toLowerCase() === filter.value.toLowerCase();
    default:
      return true;
  }
}

function matchesRule(filePath, rule) {
  const filename = path.basename(filePath);
  const ext      = path.extname(filePath).toLowerCase();
  const platform = process.platform;

  // Restriction aux dossiers sources configurés (vide = tous)
  if (rule.sourceFolders?.length > 0) {
    const normalized = path.normalize(filePath);
    const inFolder = rule.sourceFolders.some(f => {
      const nf = path.normalize(f);
      return normalized.startsWith(nf + path.sep) || normalized === nf;
    });
    if (!inFolder) return false;
  }

  if (rule.platforms?.length > 0 && !rule.platforms.includes(platform)) return false;

  if (rule.extensions?.length > 0) {
    const hasWildcard = rule.extensions.includes(".*") || rule.extensions.includes("*");
    if (!hasWildcard && !rule.extensions.some(e => e.toLowerCase() === ext)) return false;
  }

  if (rule.filters?.length > 0) {
    const filters = Array.isArray(rule.filters) ? rule.filters : (() => { try { return JSON.parse(rule.filters); } catch { return []; } })();
    for (const f of filters) {
      if (!matchesFilter(filename, f)) return false;
    }
  }

  return true;
}

export function findMatchingRule(filePath, rules, { ignoreEnabled = false } = {}) {
  if (!rules?.length) return null;
  const active = ignoreEnabled ? rules : rules.filter(r => r.enabled !== false);
  const sorted = [...active].sort((a, b) => (a.priority || 99) - (b.priority || 99));
  return sorted.find(r => matchesRule(filePath, r)) ?? null;
}

/* ─── File processing ───────────────────────────────────────── */

/**
 * Traite un fichier :
 *  1. Trouve la règle correspondante
 *  2. Extrait les variables (built-ins + capture patterns)
 *  3. Résout le chemin de destination (template)
 *  4. Optionnellement renomme le fichier (renameTemplate)
 *  5. Déplace le fichier
 */
export async function processFile(filePath, rules, defaultDestination) {
  const normalizedPath = path.normalize(filePath);

  if (!fs.existsSync(normalizedPath)) {
    return { success: false, reason: "file_not_found" };
  }

  const stable = await waitForFileStability(normalizedPath);
  if (!stable) return { success: false, reason: "file_unstable" };

  const matchedRule = findMatchingRule(normalizedPath, rules);

  // ── Résolution des variables ──────────────────────────────
  const vars = buildVars(normalizedPath, matchedRule);

  // ── Destination (template ou statique) ───────────────────
  const rawDest = matchedRule ? matchedRule.destination : defaultDestination;
  if (!rawDest) {
    await appendLog({ type: "warning", file: normalizedPath, message: "Aucune destination trouvée pour ce fichier" });
    return { success: false, reason: "no_destination" };
  }
  const destination = applyTemplate(rawDest, vars);

  // ── Nom de sortie (rename template ou nom original) ───────
  const originalBasename = path.basename(normalizedPath);
  let outputFilename = originalBasename;
  if (matchedRule?.renameTemplate) {
    const resolved = applyTemplate(matchedRule.renameTemplate, vars);
    if (resolved && resolved !== matchedRule.renameTemplate) {
      outputFilename = resolved;
    }
  }

  // ── Création du dossier destination ──────────────────────
  if (!fs.existsSync(destination)) {
    try {
      fs.mkdirSync(destination, { recursive: true });
    } catch (err) {
      await appendLog({ type: "error", file: normalizedPath, message: `Impossible de créer la destination : ${err.message}` });
      return { success: false, reason: "mkdir_failed", error: err.message };
    }
  }

  // ── Gestion des conflits de nom ───────────────────────────
  let destPath = path.join(destination, outputFilename);
  if (fs.existsSync(destPath)) {
    const ext  = path.extname(outputFilename);
    const base = path.basename(outputFilename, ext);
    destPath   = path.join(destination, `${base}_${Date.now()}${ext}`);
  }

  // ── Déplacement (rename ou copy+delete cross-device) ─────
  try {
    fs.renameSync(normalizedPath, destPath);
  } catch {
    try {
      fs.copyFileSync(normalizedPath, destPath);
      fs.unlinkSync(normalizedPath);
    } catch (copyErr) {
      await appendLog({ type: "error", file: normalizedPath, message: `Déplacement échoué : ${copyErr.message}` });
      return { success: false, reason: "move_failed", error: copyErr.message };
    }
  }

  const ruleName = matchedRule ? (matchedRule.name || matchedRule.id) : "défaut";
  await appendLog({
    type: "success",
    file: normalizedPath,
    destination: destPath,
    rule: ruleName,
    message: `${originalBasename} → ${destPath}`,
  });

  return { success: true, destination: destPath, rule: matchedRule };
}

/* ─── Stability check ───────────────────────────────────────── */
function waitForFileStability(filePath, maxWait = 10000, interval = 500) {
  return new Promise((resolve) => {
    let lastSize = -1;
    let elapsed  = 0;
    const check  = () => {
      try {
        const { size } = fs.statSync(filePath);
        if (size === lastSize && size >= 0) { resolve(true); return; }
        lastSize = size;
        elapsed += interval;
        if (elapsed >= maxWait) { resolve(true); return; }
        setTimeout(check, interval);
      } catch { resolve(false); }
    };
    setTimeout(check, interval);
  });
}
