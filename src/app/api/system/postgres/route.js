/**
 * API de gestion PostgreSQL pendant le wizard de configuration.
 *
 * GET  ?action=check          → Vérifie si PostgreSQL est installé/actif
 * POST { action: "install" }  → Installe PostgreSQL (SSE streaming)
 * POST { action: "start" }    → Démarre le service PostgreSQL
 * POST { action: "create-db" }→ Crée structureFolderDB + push Prisma schema
 * POST { action: "set-json" } → Active le mode JSON (sans PostgreSQL)
 */

import { execSync, spawn } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";
import { setStorageMode } from "@/lib/storage-mode";

const DB_NAME = "structureFolderDB";
const PLATFORM = process.platform; // "darwin", "linux", "win32"

// ─── Utilitaires ─────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf-8",
    timeout: 15000,
    stdio: ["pipe", "pipe", "pipe"],
    ...opts,
  }).trim();
}

function tryRun(cmd, opts = {}) {
  try {
    return { ok: true, output: run(cmd, opts) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Empêche psql/createdb de demander le mot de passe en console (utilise PGPASSWORD)
// Toujours définir PGPASSWORD pour éviter le prompt interactif (vide = échec auth immédiat)
function pgEnv(pgPassword = "") {
  return {
    ...process.env,
    PGPASSWORD: pgPassword ?? "",
    PGHOST: "127.0.0.1",
    PGPORT: "5432",
    PGUSER: "postgres",
  };
}

function getPsqlPath() {
  const winPaths = [
    "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
  ];
  const unixPaths = [
    "psql",
    "/opt/homebrew/opt/postgresql@18/bin/psql",
    "/opt/homebrew/opt/postgresql@17/bin/psql",
    "/opt/homebrew/opt/postgresql@16/bin/psql",
    "/opt/homebrew/bin/psql",
    "/usr/local/bin/psql",
    "/usr/bin/psql",
    "/usr/local/pgsql/bin/psql",
  ];
  const candidates = PLATFORM === "win32" ? [...winPaths, "psql"] : unixPaths;
  for (const p of candidates) {
    const r = tryRun(`"${p}" --version`);
    if (r.ok) return p;
  }
  return null;
}

function getCreatedbPath() {
  const candidates = [
    "createdb",
    "/opt/homebrew/opt/postgresql@18/bin/createdb",
    "/opt/homebrew/opt/postgresql@17/bin/createdb",
    "/opt/homebrew/opt/postgresql@16/bin/createdb",
    "/opt/homebrew/bin/createdb",
    "/usr/local/bin/createdb",
    "/usr/bin/createdb",
  ];
  for (const p of candidates) {
    const r = tryRun(`"${p}" --version`);
    if (r.ok) return p;
  }
  return null;
}

function checkPostgres() {
  const psqlPath = getPsqlPath();
  if (!psqlPath) return { installed: false, running: false };

  let version = "";
  try {
    version = run(`"${psqlPath}" --version`);
  } catch {}

  // Vérifier si le serveur répond (pg_isready — peut être absent du PATH sur Windows)
  const pgIsreadyPath = PLATFORM === "win32"
    ? path.join(path.dirname(psqlPath), "pg_isready.exe")
    : "pg_isready";
  const readyCheck = tryRun(
    PLATFORM === "win32"
      ? `"${pgIsreadyPath}" -h 127.0.0.1 -p 5432`
      : "pg_isready -h 127.0.0.1 -p 5432",
    { timeout: 3000 }
  );
  if (readyCheck.ok) {
    return { installed: true, running: true, version, psqlPath };
  }

  // Windows : fallback via Get-Service (pg_isready souvent absent du PATH)
  if (PLATFORM === "win32") {
    const svcName = getWindowsPgServiceName();
    if (svcName) {
      const svcCheck = tryRun(
        `powershell -NoProfile -Command "Get-Service -Name '${svcName}' | Select-Object -ExpandProperty Status"`,
        { timeout: 5000 }
      );
      if (svcCheck.ok && svcCheck.output.trim().toLowerCase() === "running") {
        return { installed: true, running: true, version, psqlPath };
      }
    }
  }

  // macOS : vérifier via brew services
  if (PLATFORM === "darwin") {
    const brewCheck = tryRun("brew services list 2>&1 | grep postgresql", { timeout: 5000 });
    if (brewCheck.ok && brewCheck.output.includes("started")) {
      return { installed: true, running: true, version, psqlPath };
    }
  }

  return { installed: true, running: false, version, psqlPath };
}

function hasBrew() {
  return tryRun("brew --version", { timeout: 3000 }).ok;
}

// Détecter le nom du service PostgreSQL sur Windows (postgresql-x64-16, 17, etc.)
function getWindowsPgServiceName() {
  if (PLATFORM !== "win32") return null;
  try {
    const r = run(
      "powershell -NoProfile -Command \"Get-Service | Where-Object {$_.Name -like '*postgres*'} | Select-Object -ExpandProperty Name\"",
      { timeout: 5000, encoding: "utf-8" }
    );
    const names = r.trim().split(/\r?\n/).filter(Boolean);
    return names[0] || null;
  } catch {
    return null;
  }
}

function getBrewPgVersion() {
  const r = tryRun("brew list --formula 2>/dev/null | grep postgresql", { timeout: 5000 });
  if (!r.ok) return null;
  const match = r.output.match(/postgresql@?(\d+)/);
  return match ? match[0] : "postgresql";
}

// Construire l'URL de connexion pour l'OS courant (postgresPassword optionnel)
function buildDatabaseUrl(dbName, extraUser = null, postgresPassword = null) {
  const systemUser = os.userInfo().username;
  const candidates = [];

  if (postgresPassword) {
    const encoded = encodeURIComponent(postgresPassword);
    candidates.push(`postgresql://postgres:${encoded}@127.0.0.1:5432/${dbName}`);
    return candidates; // Un seul essai avec mot de passe — évite tentatives inutiles
  }

  if (PLATFORM === "darwin") {
    candidates.push(`postgresql://${systemUser}@127.0.0.1:5432/${dbName}`);
    candidates.push(`postgresql://postgres@127.0.0.1:5432/${dbName}`);
  } else if (PLATFORM === "linux") {
    candidates.push(`postgresql://postgres@127.0.0.1:5432/${dbName}`);
    candidates.push(`postgresql://${systemUser}@127.0.0.1:5432/${dbName}`);
  } else {
    candidates.push(`postgresql://postgres@127.0.0.1:5432/${dbName}`);
    candidates.push(`postgresql://${systemUser}@127.0.0.1:5432/${dbName}`);
  }

  if (extraUser) candidates.unshift(`postgresql://${extraUser}@127.0.0.1:5432/${dbName}`);

  return candidates;
}

const CONN_TIMEOUT = 2500; // Réduit pour échec rapide (au lieu de 5s)

// Tester une connexion — avec mot de passe : PGPASSWORD + params (évite échappement shell)
function testConnection(url, psqlPath = null, pgPassword = "") {
  const psqlCmd = psqlPath ? `"${psqlPath}"` : "psql";
  const env = pgEnv(pgPassword);

  // Si mot de passe fourni : utiliser params au lieu de l'URL (évite & % " dans le shell)
  if (pgPassword) {
    const args = `-h 127.0.0.1 -p 5432 -U postgres -d postgres -c "SELECT 1" -t -A`;
    return tryRun(`${psqlCmd} ${args}`, { timeout: CONN_TIMEOUT, env });
  }

  const testUrl = url.replace(/\/[^/]+$/, "/postgres");
  return tryRun(`${psqlCmd} "${testUrl}" -c "SELECT 1" -t -A`, { timeout: CONN_TIMEOUT, env });
}

// Trouver la première URL qui fonctionne
function findWorkingUrl(candidates, psqlPath = null, pgPassword = "") {
  for (const url of candidates) {
    const r = testConnection(url, psqlPath, pgPassword);
    if (r.ok) return url;
  }
  return null;
}

// Créer la base de données (pgPassword évite le prompt console)
function createDatabase(psqlPath, dbName, workingUrl, pgPassword = "") {
  const env = pgEnv(pgPassword);
  // Tenter avec createdb d'abord
  const createdbPath = getCreatedbPath();
  if (createdbPath) {
    const r = tryRun(`"${createdbPath}" "${dbName}"`, { timeout: 10000, env });
    if (r.ok) return { ok: true };
    if (r.error?.includes("already exists") || r.error?.includes("existe déjà")) return { ok: true, alreadyExists: true };
  }

  // Fallback via psql
  if (psqlPath && workingUrl) {
    const baseUrl = workingUrl.replace(/\/[^/]+$/, "/postgres");
    const r = tryRun(
      `"${psqlPath}" "${baseUrl}" -c "CREATE DATABASE \\"${dbName}\\""`,
      { timeout: 10000, env }
    );
    if (r.ok) return { ok: true };
    if (r.error?.includes("already exists") || r.error?.includes("existe déjà")) return { ok: true, alreadyExists: true };
    return { ok: false, error: r.error };
  }

  // Linux : essai avec sudo -u postgres
  if (PLATFORM === "linux") {
    const r = tryRun(`sudo -u postgres createdb "${dbName}"`, { timeout: 10000, env });
    if (r.ok) return { ok: true };
    if (r.error?.includes("already exists") || r.error?.includes("existe déjà")) return { ok: true, alreadyExists: true };
  }

  return { ok: false, error: "Impossible de créer la base de données" };
}

// Écrire l'URL dans .env.local
function writeEnvLocal(databaseUrl) {
  const envPath = path.join(process.cwd(), ".env.local");
  let content = "";

  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
    // Remplacer ou ajouter DATABASE_URL
    if (content.includes("DATABASE_URL=")) {
      content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${databaseUrl}"`);
    } else {
      content += `\nDATABASE_URL="${databaseUrl}"\n`;
    }
  } else {
    // Générer un JWT_SECRET s'il n'existe pas
    const { randomBytes } = require("crypto");
    const jwtSecret = randomBytes(32).toString("hex");
    content = `# Généré automatiquement par File Organizer\nDATABASE_URL="${databaseUrl}"\nJWT_SECRET="${jwtSecret}"\n`;
  }

  fs.writeFileSync(envPath, content, "utf-8");
}

// Exécuter prisma db push
async function runPrismaDbPush(databaseUrl) {
  return new Promise((resolve) => {
    const binDir = path.join(process.cwd(), "node_modules", ".bin");
    const prismaBin = PLATFORM === "win32"
      ? path.join(binDir, "prisma.cmd")
      : path.join(binDir, "prisma");
    const child = spawn(prismaBin, ["db", "push", "--skip-generate"], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      cwd: process.cwd(),
      shell: PLATFORM === "win32",
    });

    let output = "";
    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));
    child.on("close", (code) => {
      resolve({ ok: code === 0, output, code });
    });
    child.on("error", (e) => resolve({ ok: false, error: e.message }));

    setTimeout(() => {
      child.kill();
      resolve({ ok: false, error: "Timeout lors du push Prisma" });
    }, 60000);
  });
}

// ─── GET — Vérification de l'état ─────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "check";

  if (action === "check") {
    const status = checkPostgres();
    const payload = {
      ...status,
      platform: PLATFORM,
      hasBrew: PLATFORM === "darwin" ? hasBrew() : false,
    };
    if (PLATFORM === "win32") {
      payload.currentUser = os.userInfo().username;
      payload.computerName = os.hostname();
    }
    return Response.json(payload);
  }

  // Script PowerShell pour réinitialiser le mot de passe postgres (Windows uniquement)
  if (action === "reset-password-script") {
    if (PLATFORM !== "win32") {
      return Response.json({ error: "Ce script est pour Windows uniquement." }, { status: 400 });
    }
    const serviceName = getWindowsPgServiceName() || "postgresql-x64-16";
    const script = `# Reset PostgreSQL password - structureFolder
# Run as Administrator (right-click -> Run as administrator)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERREUR: Executez ce script en tant qu'administrateur." -ForegroundColor Red
    pause
    exit 1
}

$svcName = "${serviceName}"
$svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-Host "PostgreSQL non trouve (service: $svcName)" -ForegroundColor Red
    pause
    exit 1
}

$dataDir = $null
$svcObj = Get-CimInstance Win32_Service -Filter "Name='$svcName'" -ErrorAction SilentlyContinue
if ($svcObj -and $svcObj.PathName -match '-D\\s*"([^"]+)"') {
    $dataDir = $Matches[1].Trim()
}
if (-not $dataDir) {
    $regPath = "HKLM:\\SOFTWARE\\PostgreSQL\\Installations"
    if (Test-Path $regPath) {
        Get-ChildItem $regPath -ErrorAction SilentlyContinue | ForEach-Object {
            $dd = Get-ItemProperty $_.PSPath -Name "Data Directory" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty "Data Directory"
            if ($dd) { $dataDir = $dd }
        }
    }
}
if (-not $dataDir) {
    $ver = if ($svcName -match '(\\d+)$') { $Matches[1] } else { "16" }
    $dataDir = "C:\\Program Files\\PostgreSQL\\$ver\\data"
}
Write-Host "Repertoire data: $dataDir" -ForegroundColor Gray
if (-not (Test-Path $dataDir)) {
    Write-Host "Repertoire data introuvable: $dataDir" -ForegroundColor Red
    pause
    exit 1
}

$pgHba = Join-Path $dataDir "pg_hba.conf"
$pgHbaBak = Join-Path $dataDir "pg_hba.conf.bak.$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "1. Arret du service PostgreSQL..." -ForegroundColor Cyan
Stop-Service $svcName -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "2. Sauvegarde et modification de pg_hba.conf..." -ForegroundColor Cyan
Copy-Item $pgHba $pgHbaBak -Force
$content = Get-Content $pgHba -Raw
$trustRules = "host all all 127.0.0.1/32 trust
host all all ::1/128 trust

"
$newContent = $trustRules + $content
[System.IO.File]::WriteAllText($pgHba, $newContent, [System.Text.UTF8Encoding]::new($false))
Write-Host "   Fichier modifie: $pgHba" -ForegroundColor Gray
$firstLines = (Get-Content $pgHba -TotalCount 6) -join [char]10
Write-Host "   Premières lignes:" -ForegroundColor Gray
Write-Host $firstLines -ForegroundColor DarkGray

Write-Host "3. Demarrage du service PostgreSQL..." -ForegroundColor Cyan
Start-Service $svcName
Start-Sleep -Seconds 10

$psqlPaths = @("C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe","C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe","C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe","C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe","C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe")
$psql = $null
foreach ($p in $psqlPaths) { if (Test-Path $p) { $psql = $p; break } }
if (-not $psql) {
    Write-Host "psql introuvable. Restauration..." -ForegroundColor Red
    Copy-Item $pgHbaBak $pgHba -Force
    Restart-Service $svcName -Force
    pause
    exit 1
}

Write-Host "4. Entrez le NOUVEAU mot de passe:" -ForegroundColor Cyan
$sec = Read-Host -AsSecureString "Nouveau mot de passe"
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
$escaped = $plain -replace "'", "''"
$sql = "ALTER USER postgres WITH PASSWORD '" + $escaped + "';"

$env:PGPASSWORD = ""
$result = & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -w -c $sql 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur:" -ForegroundColor Red
    Write-Host $result
    Write-Host ""
    Write-Host "Si psql demande encore un mot de passe, pg_hba.conf n'a pas ete modifie. Verifiez le fichier manuellement." -ForegroundColor Yellow
} else {
    Write-Host "Mot de passe modifie avec succes!" -ForegroundColor Green
}

Write-Host "5. Restauration de pg_hba.conf..." -ForegroundColor Cyan
Copy-Item $pgHbaBak $pgHba -Force

Write-Host "6. Redemarrage final..." -ForegroundColor Cyan
Restart-Service $svcName -Force

Write-Host ""
Write-Host "Termine." -ForegroundColor Green
pause
`;
    return new Response(script, {
      headers: {
        "Content-Type": "application/x-powershell; charset=utf-8",
        "Content-Disposition": "attachment; filename=reset-postgres-password.ps1",
      },
    });
  }

  // Téléchargement direct de l'installateur Windows (exe) — pas de redirection vers le site
  if (action === "download") {
    const version = searchParams.get("version") || "16";
    const VERSIONS = {
      14: "14.22-1",
      15: "15.17-1",
      16: "16.13-1",
      17: "17.9-1",
      18: "18.3-1",
    };
    const ver = VERSIONS[version] || VERSIONS[16];
    const url = `https://get.enterprisedb.com/postgresql/postgresql-${ver}-windows-x64.exe`;
    return Response.redirect(url, 302);
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 });
}

// ─── POST — Actions (install, start, create-db, set-json) ─────

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { action } = body;

  // ── Activer le mode JSON ────────────────────────────────────
  if (action === "set-json") {
    setStorageMode("json");
    return Response.json({ ok: true, mode: "json" });
  }

  // ── Installer / Réinstaller PostgreSQL (SSE streaming) ───────────────────
  if (action === "install") {
    const { version, reinstall } = body; // version: "14"|"15"|"16"|"17", reinstall: bool
    const pgVersion = version && ["14", "15", "16", "17", "18"].includes(String(version))
      ? `postgresql@${version}`
      : "postgresql@16";

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          } catch {}
        };

        try {
          send({ step: "start", message: reinstall ? `Réinstallation de ${pgVersion}...` : `Installation de ${pgVersion}...` });

          if (PLATFORM === "darwin") {
            // macOS — via Homebrew
            if (!hasBrew()) {
              send({
                step: "error",
                message:
                  "Homebrew n'est pas installé. Installez-le depuis https://brew.sh puis relancez.",
                requiresAction: true,
                brewInstallUrl: "https://brew.sh",
              });
              return;
            }

            send({ step: "progress", message: `${reinstall ? "Réinstallation" : "Installation"} de ${pgVersion} via Homebrew (2-5 min)...` });

            const brewCmd = reinstall ? ["reinstall", pgVersion] : ["install", pgVersion];
            await new Promise((resolve) => {
              const child = spawn("brew", brewCmd, {
                shell: false,
                env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: "1" },
              });

              child.stdout.on("data", (d) => {
                const line = d.toString().trim();
                if (line) send({ step: "output", message: line });
              });
              child.stderr.on("data", (d) => {
                const line = d.toString().trim();
                if (line && !line.startsWith("==>")) send({ step: "output", message: line });
              });
              child.on("close", (code) => resolve({ code }));
              child.on("error", (e) => resolve({ error: e.message }));
            });

            send({ step: "progress", message: "Démarrage du service PostgreSQL..." });

            const startResult = await new Promise((resolve) => {
              const child = spawn("brew", ["services", "start", pgVersion], { shell: false });
              let out = "";
              child.stdout.on("data", (d) => (out += d));
              child.stderr.on("data", (d) => (out += d));
              child.on("close", (code) => resolve({ code, output: out }));
              child.on("error", (e) => resolve({ error: e.message }));
            });

            if (startResult.error) {
              send({ step: "error", message: `Erreur démarrage : ${startResult.error}` });
              return;
            }

            // Attendre que le serveur soit prêt (max 15s)
            send({ step: "progress", message: "Attente du démarrage du serveur..." });
            let ready = false;
            for (let i = 0; i < 15; i++) {
              await new Promise((r) => setTimeout(r, 1000));
              const r = tryRun("pg_isready -h 127.0.0.1 -p 5432", { timeout: 2000 });
              if (r.ok) {
                ready = true;
                break;
              }
            }

            if (!ready) {
              send({ step: "error", message: "Le serveur PostgreSQL ne répond pas. Vérifiez le service manuellement." });
              return;
            }

            send({ step: "done", message: "PostgreSQL installé et démarré avec succès !" });

          } else if (PLATFORM === "linux") {
            const hasSudo = tryRun("which sudo", { timeout: 3000 }).ok;
            const aptok = hasSudo && tryRun("which apt-get", { timeout: 3000 }).ok;
            const yumok = !aptok && hasSudo && tryRun("which yum", { timeout: 3000 }).ok;

            if (!aptok && !yumok) {
              send({ step: "error", message: "Gestionnaire de paquets non supporté. Installez PostgreSQL manuellement." });
              return;
            }

            const cmds = aptok
              ? ["sudo apt-get update -y", "sudo apt-get install -y postgresql postgresql-contrib", "sudo systemctl start postgresql", "sudo systemctl enable postgresql"]
              : ["sudo yum install -y postgresql-server postgresql-contrib", "sudo postgresql-setup initdb", "sudo systemctl start postgresql", "sudo systemctl enable postgresql"];

            for (const cmd of cmds) {
              send({ step: "progress", message: `Exécution : ${cmd}` });
              const r = await new Promise((resolve) => {
                const parts = cmd.split(" ");
                const child = spawn(parts[0], parts.slice(1), { shell: false });
                let out = "";
                child.stdout.on("data", (d) => (out += d));
                child.stderr.on("data", (d) => (out += d));
                child.on("close", (code) => resolve({ code, output: out }));
                child.on("error", (e) => resolve({ error: e.message }));
              });
              if (r.error || r.code !== 0) {
                send({ step: "error", message: `Erreur : ${r.output || r.error}` });
                return;
              }
            }

            send({ step: "done", message: "PostgreSQL installé et démarré avec succès !" });

          } else if (PLATFORM === "win32") {
            // Windows : winget ou Chocolatey
            const wingetOk = tryRun("winget --version", { timeout: 3000 }).ok;
            const chocoOk = tryRun("choco --version", { timeout: 3000 }).ok;

            const winPgId = { 14: "PostgreSQL.PostgreSQL.14", 15: "PostgreSQL.PostgreSQL.15", 16: "PostgreSQL.PostgreSQL.16", 17: "PostgreSQL.PostgreSQL.17", 18: "PostgreSQL.PostgreSQL.18" }[pgVersion.replace("postgresql@", "")] || "PostgreSQL.PostgreSQL.16";

            if (wingetOk) {
              send({ step: "progress", message: `Installation via winget (${winPgId}) — une fenêtre UAC peut s'ouvrir...` });
              const forceArg = reinstall ? ',"--force"' : "";
              const psCmd = `Start-Process -FilePath "winget" -ArgumentList "install","${winPgId}","-e","--silent","--accept-package-agreements","--accept-source-agreements"${forceArg} -Verb RunAs -Wait`;
              try {
                execSync(`powershell -NoProfile -Command "${psCmd}"`, {
                  timeout: 300000,
                  encoding: "utf-8",
                  shell: true,
                });
              } catch (err) {
                const msg = (err.message || "").toString();
                if (msg.includes("already installed") || msg.includes("déjà installé")) {
                  send({ step: "progress", message: "PostgreSQL déjà installé." });
                } else {
                  send({ step: "error", message: `Erreur winget : ${msg}` });
                  return;
                }
              }
            } else if (chocoOk) {
              send({ step: "progress", message: "Installation via Chocolatey — une fenêtre UAC peut s'ouvrir..." });
              const psCmd = `Start-Process -FilePath "choco" -ArgumentList "install","postgresql","-y" -Verb RunAs -Wait`;
              try {
                execSync(`powershell -NoProfile -Command "${psCmd}"`, {
                  timeout: 300000,
                  encoding: "utf-8",
                  shell: true,
                });
              } catch (err) {
                send({ step: "error", message: `Erreur Chocolatey : ${err.message}` });
                controller.close();
                return;
              }
            } else {
              send({
                step: "manual",
                message: "winget et Chocolatey non détectés. Installez winget (Windows 10/11) ou Chocolatey.",
                downloadUrl: "https://www.postgresql.org/download/windows/",
              });
              return;
            }

            send({ step: "progress", message: "Démarrage du service PostgreSQL..." });
            const serviceName = getWindowsPgServiceName() || "postgresql-x64-16";
            const startCmd = `Start-Process -FilePath "net" -ArgumentList "start","${serviceName}" -Verb RunAs -Wait`;
            try {
              execSync(`powershell -NoProfile -Command "${startCmd}"`, { timeout: 60000, shell: true });
            } catch {}

            send({ step: "progress", message: "Attente du démarrage du serveur..." });
            const pgIsreadyPath = getPsqlPath() ? path.join(path.dirname(getPsqlPath()), "pg_isready.exe") : null;
            let ready = false;
            for (let i = 0; i < 20; i++) {
              await new Promise((r) => setTimeout(r, 1000));
              const r = pgIsreadyPath
                ? tryRun(`"${pgIsreadyPath}" -h 127.0.0.1 -p 5432`, { timeout: 2000 })
                : tryRun("pg_isready -h 127.0.0.1 -p 5432", { timeout: 2000 });
              if (r.ok) {
                ready = true;
                break;
              }
            }
            if (!ready) {
              send({ step: "error", message: "Le serveur ne répond pas. Démarrez le service manuellement : net start postgresql-x64-16" });
              return;
            }
            send({ step: "done", message: "PostgreSQL installé et démarré avec succès !" });
          } else {
            send({
              step: "manual",
              message: "Installation automatique non disponible pour cette plateforme.",
              downloadUrl: "https://www.postgresql.org/download/",
            });
          }
        } catch (err) {
          send({ step: "error", message: `Erreur inattendue : ${err.message}` });
        } finally {
          try { controller.close(); } catch {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // ── Démarrer le service PostgreSQL ──────────────────────────
  if (action === "start") {
    const { username: adminUser, password: adminPassword } = body;
    try {
      if (PLATFORM === "darwin") {
        const pgPkg = getBrewPgVersion() ?? "postgresql@16";
        run(`brew services start ${pgPkg}`, { timeout: 10000 });
        // Attendre la disponibilité
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const r = tryRun("pg_isready -h 127.0.0.1 -p 5432", { timeout: 2000 });
          if (r.ok) return Response.json({ ok: true });
        }
        return Response.json({ ok: false, error: "Le serveur ne répond pas après démarrage" });
      } else if (PLATFORM === "linux") {
        run("sudo systemctl start postgresql", { timeout: 15000 });
        return Response.json({ ok: true });
      } else {
        // Windows : avec identifiants fournis → Start-Process -Credential ; sinon → UAC (Verb RunAs)
        const serviceName = getWindowsPgServiceName() || "postgresql-x64-16";
        const computerName = os.hostname();

        if (adminUser && adminPassword) {
          // Utiliser les identifiants fournis (format .\user ou COMPUTER\user)
          const fullUser = adminUser.includes("\\") ? adminUser : `${computerName}\\${adminUser}`;
          const scriptPath = path.join(os.tmpdir(), `pg-start-${Date.now()}.ps1`);
          const psContent = [
            "$p = $env:ADMIN_PWD",
            "if (-not $p) { Write-Error 'Mot de passe non fourni'; exit 1 }",
            "$sec = ConvertTo-SecureString $p -AsPlainText -Force",
            `$cred = New-Object System.Management.Automation.PSCredential('${fullUser.replace(/'/g, "''")}', $sec)`,
            `Start-Process -FilePath 'net' -ArgumentList 'start','${serviceName}' -Credential $cred -Wait`,
          ].join("\n");
          try {
            fs.writeFileSync(scriptPath, psContent, "utf-8");
            execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, {
              timeout: 60000,
              encoding: "utf-8",
              env: { ...process.env, ADMIN_PWD: adminPassword },
            });
          } catch (err) {
            const msg = (err.message || err.stderr || "").toString();
            if (msg.includes("logon") || msg.includes("mot de passe") || msg.includes("password") || msg.includes("credentials") || msg.includes("Access denied") || msg.includes("5") || msg.includes("incorrect")) {
              return Response.json({
                ok: false,
                error: "Identifiants incorrects : vérifiez le nom d'utilisateur et le mot de passe.",
              }, { status: 500 });
            }
            return Response.json({ ok: false, error: msg || "Erreur lors du démarrage du service." }, { status: 500 });
          } finally {
            try { fs.unlinkSync(scriptPath); } catch {}
          }
        } else {
          // Tentative UAC (sans mot de passe)
          const psCmd = `Start-Process -FilePath 'net' -ArgumentList 'start','${serviceName}' -Verb RunAs -Wait`;
          try {
            run(`powershell -NoProfile -Command "${psCmd}"`, { timeout: 60000 });
          } catch (err) {
            const msg = err.message || "";
            if (msg.includes("Accès refusé") || msg.includes("Access denied") || msg.includes("5")) {
              return Response.json({
                ok: false,
                error: "Droits administrateur requis. Entrez vos identifiants Windows dans la fenêtre ci-dessus.",
                requiresAdmin: true,
                serviceName,
              }, { status: 500 });
            }
            throw err;
          }
        }

        // Vérifier que le serveur répond
        const pgIsreadyPath = PLATFORM === "win32" && getPsqlPath()
          ? path.join(path.dirname(getPsqlPath()), "pg_isready.exe")
          : "pg_isready";
        const readyCmd = PLATFORM === "win32" ? `"${pgIsreadyPath}" -h 127.0.0.1 -p 5432` : "pg_isready -h 127.0.0.1 -p 5432";
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const r = tryRun(readyCmd, { timeout: 2000 });
          if (r.ok) return Response.json({ ok: true });
        }
        return Response.json({ ok: false, error: "Le serveur ne répond pas après démarrage" });
      }
    } catch (e) {
      const msg = e.message || "";
      if (PLATFORM === "win32" && (msg.includes("Accès refusé") || msg.includes("Access denied") || msg.includes("5"))) {
        return Response.json({
          ok: false,
          error: "Droits administrateur requis. Entrez vos identifiants Windows dans la fenêtre ci-dessus.",
          requiresAdmin: true,
          serviceName: getWindowsPgServiceName() || "postgresql-x64-16",
        }, { status: 500 });
      }
      return Response.json({ ok: false, error: msg }, { status: 500 });
    }
  }

  // ── Créer la DB + push schema Prisma ────────────────────────
  if (action === "create-db") {
    const { postgresPassword } = body;
    try {
      const status = checkPostgres();
      if (!status.installed) {
        return Response.json({ ok: false, error: "PostgreSQL n'est pas installé" }, { status: 400 });
      }
      if (!status.running) {
        return Response.json({ ok: false, error: "Le service PostgreSQL n'est pas démarré" }, { status: 400 });
      }

      // Trouver l'URL qui fonctionne (avec mot de passe postgres si fourni)
      const urlCandidates = buildDatabaseUrl("postgres", null, postgresPassword || undefined);
      const workingBaseUrl = findWorkingUrl(urlCandidates, status.psqlPath, postgresPassword || "");
      if (!workingBaseUrl && PLATFORM !== "linux") {
        const msg = postgresPassword
          ? "Mot de passe incorrect. Vérifiez le mot de passe de l'utilisateur postgres."
          : "Impossible de se connecter à PostgreSQL. L'utilisateur postgres requiert peut-être un mot de passe.";
        return Response.json(
          {
            ok: false,
            error: msg,
            requiresPostgresPassword: !postgresPassword,
          },
          { status: 500 }
        );
      }

      // Créer la base de données
      const createResult = createDatabase(status.psqlPath, DB_NAME, workingBaseUrl, postgresPassword || "");
      if (!createResult.ok) {
        return Response.json({ ok: false, error: createResult.error }, { status: 500 });
      }

      // Construire l'URL finale vers structureFolderDB
      let databaseUrl = workingBaseUrl
        ? workingBaseUrl.replace(/\/[^/]+$/, `/${DB_NAME}`)
        : `postgresql://postgres@127.0.0.1:5432/${DB_NAME}`;

      // Sur Linux, si on ne peut pas se connecter directement, utiliser le user postgres
      if (PLATFORM === "linux" && !workingBaseUrl) {
        databaseUrl = `postgresql://postgres@127.0.0.1:5432/${DB_NAME}`;
      }

      // Sauvegarder l'URL dans .env.local ET storage-mode.json
      writeEnvLocal(databaseUrl);
      process.env.DATABASE_URL = databaseUrl;

      // Appliquer le schema Prisma
      const pushResult = await runPrismaDbPush(databaseUrl);
      if (!pushResult.ok) {
        return Response.json(
          { ok: false, error: `Erreur lors de l'initialisation du schéma : ${pushResult.error ?? pushResult.output}` },
          { status: 500 }
        );
      }

      // Activer le mode Prisma et sauvegarder l'URL
      setStorageMode("prisma", databaseUrl);

      return Response.json({
        ok: true,
        databaseUrl,
        dbName: DB_NAME,
        alreadyExists: createResult.alreadyExists,
        message: createResult.alreadyExists
          ? `Base de données "${DB_NAME}" déjà existante — schéma synchronisé.`
          : `Base de données "${DB_NAME}" créée et initialisée avec succès.`,
      });
    } catch (err) {
      return Response.json({ ok: false, error: err.message }, { status: 500 });
    }
  }

  return Response.json({ error: "Action inconnue" }, { status: 400 });
}
