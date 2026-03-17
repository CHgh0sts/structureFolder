import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAppConfig, getRules } from "@/lib/config";
import { findMatchingRule, buildVars, applyTemplate } from "@/lib/rules-engine";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

/**
 * Scan récursif d'un dossier et collecte les fichiers (dry-run).
 */
function scanDir(folder, recursive, excludedFolders = [], results = []) {
  let entries;
  try {
    entries = fs.readdirSync(folder);
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const filePath = path.join(folder, entry);
    let stat;
    try { stat = fs.statSync(filePath); } catch { continue; }

    if (stat.isDirectory()) {
      if (!recursive) continue;
      const norm = path.normalize(filePath);
      const excluded = excludedFolders.some(exc => {
        const ne = path.normalize(exc);
        return norm === ne || norm.startsWith(ne + path.sep);
      });
      if (excluded) continue;
      scanDir(filePath, recursive, excludedFolders, results);
    } else if (stat.isFile()) {
      results.push(filePath);
    }
  }
  return results;
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { ruleId } = await request.json();
  if (!ruleId) {
    return NextResponse.json({ error: "ruleId requis" }, { status: 400 });
  }

  const [config, allRules] = await Promise.all([getAppConfig(), getRules()]);
  if (!config) {
    return NextResponse.json({ error: "Configuration introuvable" }, { status: 500 });
  }

  const rule = allRules.find(r => r.id === ruleId);
  if (!rule) {
    return NextResponse.json({ error: "Règle introuvable" }, { status: 404 });
  }

  const { watchFolders = [], recursive = false, excludedFolders = [], defaultDestination } = config;

  // Collecter tous les fichiers
  const allFiles = [];
  for (const folder of watchFolders) {
    scanDir(folder, recursive, excludedFolders, allFiles);
  }

  // Tester la règle (ignoreEnabled=true car on teste même une règle désactivée)
  const matches = [];
  for (const filePath of allFiles) {
    const matched = findMatchingRule(filePath, [rule], { ignoreEnabled: true });
    if (!matched) continue;

    const vars = buildVars(filePath, matched);
    const resolvedDest = applyTemplate(matched.destination, vars);
    const originalName = path.basename(filePath);
    let outputName = originalName;
    if (matched.renameTemplate) {
      const resolved = applyTemplate(matched.renameTemplate, vars);
      if (resolved && resolved !== matched.renameTemplate) outputName = resolved;
    }

    matches.push({
      file: filePath,
      filename: originalName,
      destination: resolvedDest,
      outputName,
      finalPath: path.join(resolvedDest, outputName),
    });
  }

  return NextResponse.json({
    rule: { id: rule.id, name: rule.name },
    scanned: allFiles.length,
    matches,
  });
}
