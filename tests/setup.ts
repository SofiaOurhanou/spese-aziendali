/**
 * Questo file di setup Vitest viene eseguito prima di ogni file di test per rendere disponibili le
 * variabili d'ambiente del file .env (DATABASE_URL, JWT_SECRET, ecc.) quando i test importano
 * direttamente lib/prisma o le route API senza passare dal server Next.js. Senza dotenv.config()
 * i test di integrazione fallirebbero in CI o su macchine nuove dove le env non sono già esportate
 * nella shell. È volutamente minimo: la configurazione più ampia (alias, globals) sta in vitest.config.ts.
 */

import dotenv from "dotenv";
dotenv.config();
