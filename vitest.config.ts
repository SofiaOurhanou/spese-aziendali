/**
 * Questo file configura Vitest per i test di integrazione e unità del backend: environment node perché
 * le API route e Prisma girano lato server senza DOM, globals true per usare describe/it/expect senza
 * import espliciti, setupFiles che carica tests/setup.ts per le variabili d'ambiente. L'alias @ → root
 * del progetto replica tsconfig così gli import come @/lib/prisma funzionano nei test come nel codice
 * applicativo. I test in tests/api colpiscono handler Next.js con richieste mock e database reale seedato,
 * verificando flussi end-to-end richiesti dalla qualità della prova (auth, CRUD rimborsi, autorizzazioni).
 */

import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
