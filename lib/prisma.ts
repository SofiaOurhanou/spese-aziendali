/**
 * Questo modulo esporta un'unica istanza condivisa di PrismaClient per tutte le API route,
 * perché in ambiente serverless/dev hot-reload creare un client nuovo a ogni import aprirebbe
 * troppe connessioni PostgreSQL e finirebbe per esaurire il pool. Il pattern singleton su
 * globalThis in development preserva l'istanza tra i reload di Next.js. Con Prisma 7 la
 * connessione non è più implicita nel client generato: serve l'adapter `@prisma/adapter-pg` sopra
 * un Pool `pg`, puntato a DATABASE_URL. Il client generato vive in app/generated/prisma come da
 * configurazione dello schema. In produzione si loggano solo errori; in development anche warning,
 * per non intasare la console durante lo sviluppo ordinario.
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPrismaClient() {
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
