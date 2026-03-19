import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { getSession } from "@/lib/auth";

/**
 * Récupère tous les disques Windows avec leurs noms de volume et types.
 * DriveType: 2=amovible, 3=local, 4=réseau, 5=CD/DVD, 6=RAM disk
 * Retourne un tableau de { letter, name, path, type } 
 */
function getWindowsDrives() {
  const drives = [];
  try {
    const output = execSync("wmic logicaldisk get Caption,VolumeName,DriveType /format:csv", {
      encoding: "utf-8",
      timeout: 5000,
      windowsHide: true,
    });
    const lines = output.trim().split("\n").filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length >= 4) {
        const letter = parts[1]?.trim();
        const driveType = parseInt(parts[2]?.trim() || "0", 10);
        const volumeName = parts[3]?.trim() || "";
        if (letter && /^[A-Z]:$/i.test(letter)) {
          let displayName = volumeName;
          let typeLabel = "local";
          if (driveType === 2) {
            displayName = displayName || "Disque amovible";
            typeLabel = "removable";
          } else if (driveType === 3) {
            displayName = displayName || "Disque local";
            typeLabel = "local";
          } else if (driveType === 4) {
            displayName = displayName || "Lecteur réseau";
            typeLabel = "network";
          } else if (driveType === 5) {
            displayName = displayName || "Lecteur CD/DVD";
            typeLabel = "cdrom";
          } else {
            displayName = displayName || "Disque";
          }
          displayName += ` (${letter})`;
          drives.push({ letter, name: displayName, path: letter + "\\", type: typeLabel });
        }
      }
    }
  } catch {
    const fallbackLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (const l of fallbackLetters) {
      const letter = l + ":";
      try {
        fs.accessSync(letter + "\\");
        drives.push({ letter, name: `Disque (${letter})`, path: letter + "\\", type: "local" });
      } catch {
        // Disque non accessible
      }
    }
  }
  return drives;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  const platform = process.platform;
  const homeDir = os.homedir();
  const sep = path.sep;
  const tmpDir = os.tmpdir();

  if (action === "info") {
    return NextResponse.json({ platform, homeDir, sep, tmpDir });
  }

  if (action === "browse") {
    const session = await getSession();
    if (!session) {
      // Autoriser la navigation pendant le wizard de setup (app pas encore initialisée)
      try {
        const { isInitialized } = await import("@/lib/config");
        const initialized = await isInitialized();
        if (initialized) {
          return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }
        // Pas encore initialisé → on est en setup, on autorise
      } catch {
        // Impossible de vérifier → on est probablement en setup, on autorise
      }
    }

    const dir = searchParams.get("dir") || homeDir;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const items = entries
        .filter((e) => {
          if (!e.isDirectory()) return false;
          // Masquer les dossiers système cachés (commençant par .)
          if (e.name.startsWith(".")) return false;
          // Masquer les dossiers système macOS
          if (platform === "darwin") {
            const macHidden = new Set(["private", "dev", "cores", "opt", "etc", "sbin", "var"]);
            if (dir === "/" && macHidden.has(e.name)) return false;
          }
          return true;
        })
        .map((e) => ({
          name: e.name,
          path: path.join(dir, e.name),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

      // Obtenir le parent
      const parent = path.dirname(dir);
      const isRoot = dir === parent;

      // Racines selon l'OS
      let roots = [];
      if (platform === "win32") {
        const drives = getWindowsDrives();
        roots = drives.map((d) => ({ name: d.name, path: d.path, type: d.type }));
      } else if (platform === "darwin") {
        // macOS : raccourcis utiles
        roots = [
          { name: "Maison (~)", path: homeDir },
          { name: "Bureau",     path: path.join(homeDir, "Desktop") },
          { name: "Documents",  path: path.join(homeDir, "Documents") },
          { name: "Téléchargements", path: path.join(homeDir, "Downloads") },
          { name: "Volumes",    path: "/Volumes" },
          { name: "/",          path: "/" },
        ].filter((r) => { try { fs.accessSync(r.path); return true; } catch { return false; } });
      } else {
        roots = [
          { name: "Maison (~)", path: homeDir },
          { name: "/",          path: "/" },
        ];
      }

      return NextResponse.json({
        current: dir,
        parent: isRoot ? null : parent,
        items,
        roots,
      });
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Réponse par défaut
  return NextResponse.json({ platform, homeDir, sep });
}
