import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import fs from "fs";
import { getSession } from "@/lib/auth";

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
        const drives = ["C:", "D:", "E:", "F:", "G:", "H:"].filter((d) => {
          try { fs.accessSync(d + "\\"); return true; } catch { return false; }
        });
        roots = drives.map((d) => ({ name: d, path: d + "\\" }));
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
