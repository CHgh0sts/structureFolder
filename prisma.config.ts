import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Charger .env.local (Next.js) pour les commandes CLI Prisma
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // env() ne fonctionne pas ici, on lit directement process.env
    url: process.env.DATABASE_URL ?? "",
  },
});
