import prisma from "./db.js";

// ─── AppConfig ────────────────────────────────────────────────

/**
 * Retourne la configuration de l'application (1 seule ligne en DB).
 * @returns {Promise<AppConfig|null>}
 */
export async function getAppConfig() {
  return prisma.appConfig.findFirst();
}

/**
 * Vérifie si l'application a été initialisée.
 * @returns {Promise<boolean>}
 */
export async function isInitialized() {
  const cfg = await prisma.appConfig.findFirst({ select: { initialized: true } });
  return cfg?.initialized === true;
}

/**
 * Crée la configuration initiale (premier lancement).
 * Crée aussi l'utilisateur admin.
 */
export async function initializeApp({ siteName, adminUsername, adminPassword, watchFolders, defaultDestination }) {
  return prisma.$transaction(async (tx) => {
    // Créer ou remplacer la config
    const existingConfig = await tx.appConfig.findFirst();
    const config = existingConfig
      ? await tx.appConfig.update({
          where: { id: existingConfig.id },
          data: { siteName, watchFolders, defaultDestination, initialized: true },
        })
      : await tx.appConfig.create({
          data: { siteName, watchFolders, defaultDestination, initialized: true },
        });

    // Créer ou remplacer l'utilisateur admin
    const existing = await tx.user.findFirst({ where: { username: adminUsername } });
    if (existing) {
      await tx.user.update({ where: { id: existing.id }, data: { password: adminPassword } });
    } else {
      await tx.user.create({ data: { username: adminUsername, password: adminPassword, role: "admin" } });
    }

    return config;
  });
}

/**
 * Met à jour la configuration (watchFolders, defaultDestination, siteName…).
 */
export async function updateAppConfig(data) {
  const current = await prisma.appConfig.findFirst();
  if (!current) throw new Error("Configuration non trouvée");
  return prisma.appConfig.update({ where: { id: current.id }, data });
}

// ─── Users ────────────────────────────────────────────────────

export async function getUserByUsername(username) {
  return prisma.user.findUnique({ where: { username: username.toLowerCase() } });
}

export async function updateUserPassword(username, hashedPassword) {
  return prisma.user.update({
    where: { username: username.toLowerCase() },
    data: { password: hashedPassword },
  });
}

// ─── Rules ───────────────────────────────────────────────────

export async function getRules() {
  return prisma.rule.findMany({ orderBy: { priority: "asc" } });
}

export async function createRule(data) {
  const count = await prisma.rule.count();
  return prisma.rule.create({
    data: {
      name: data.name || `Règle ${count + 1}`,
      priority: data.priority ?? count + 1,
      extensions: data.extensions || [],
      filters: data.filters || [],
      destination: data.destination,
      platforms: data.platforms || [],
      capturePatterns: data.capturePatterns || [],
      renameTemplate: data.renameTemplate || null,
    },
  });
}

export async function updateRule(id, data) {
  return prisma.rule.update({ where: { id }, data });
}

export async function updateAllRules(rules) {
  return prisma.$transaction(
    rules.map((r) =>
      prisma.rule.update({
        where: { id: r.id },
        data: {
          name: r.name,
          priority: r.priority,
          extensions: r.extensions,
          filters: r.filters,
          destination: r.destination,
          platforms: r.platforms,
          capturePatterns: r.capturePatterns || [],
          renameTemplate: r.renameTemplate || null,
        },
      })
    )
  );
}

export async function deleteRule(id) {
  return prisma.rule.delete({ where: { id } });
}

// ─── Logs ─────────────────────────────────────────────────────

/**
 * Ajoute une entrée de log et supprime les plus anciens (max 500).
 */
export async function appendLog(entry) {
  const log = await prisma.log.create({
    data: {
      type: entry.type || "info",
      message: entry.message || "",
      file: entry.file || null,
      destination: entry.destination || null,
      rule: entry.rule || null,
    },
  });

  // Garder seulement les 500 derniers logs
  const oldest = await prisma.log.findMany({
    orderBy: { createdAt: "desc" },
    skip: 500,
    select: { id: true },
  });
  if (oldest.length > 0) {
    await prisma.log.deleteMany({ where: { id: { in: oldest.map((l) => l.id) } } });
  }

  return log;
}

export async function getLogs(limit = 500) {
  return prisma.log.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function clearLogs() {
  return prisma.log.deleteMany();
}

// ─── Processed files ──────────────────────────────────────────

export async function isFileProcessed(filePath) {
  const found = await prisma.processedFile.findUnique({ where: { path: filePath } });
  return !!found;
}

export async function markFileProcessed(filePath) {
  return prisma.processedFile.upsert({
    where: { path: filePath },
    update: {},
    create: { path: filePath },
  });
}

export async function getProcessedFilesCount() {
  return prisma.processedFile.count();
}

export async function clearProcessedFiles() {
  return prisma.processedFile.deleteMany();
}
