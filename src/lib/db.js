import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Lire l'URL depuis data/storage-mode.json si DATABASE_URL n'est pas défini dans l'env
if (!process.env.DATABASE_URL) {
  try {
    const modeFile = path.join(process.cwd(), "data", "storage-mode.json");
    if (fs.existsSync(modeFile)) {
      const data = JSON.parse(fs.readFileSync(modeFile, "utf-8"));
      if (data.databaseUrl) process.env.DATABASE_URL = data.databaseUrl;
    }
  } catch {
    // Silencieux — DATABASE_URL restera indéfini si Prisma n'est pas configuré
  }
}

const globalForPrisma = globalThis;

/**
 * Singleton PrismaClient — évite de créer de multiples connexions
 * en mode développement avec le hot-reload de Next.js.
 * Note : Ce module ne doit être importé QUE depuis config-prisma.js
 */
const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
