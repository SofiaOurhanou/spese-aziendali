/**
 * Questo file è la configurazione Prisma 7 (defineConfig) che collega CLI e tooling allo schema e alle
 * migration del progetto. Indica il path di schema.prisma e la cartella prisma/migrations dove vivono
 * gli SQL versionati applicati con db:migrate. Il datasource usa DIRECT_URL da .env anziché DATABASE_URL:
 * con Supabase e pooler PostgreSQL spesso serve una connessione diretta per migrate e introspect mentre
 * l'app runtime può usare il pooler. Carica dotenv/config così i comandi prisma eseguiti da terminale
 * trovano le variabili senza passare da Next.js. È generato/aggiornato dal workflow Prisma moderno
 * separato dal vecchio schema-only in schema.prisma.
 */

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"],
  },
});
