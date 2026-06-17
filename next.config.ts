/**
 * Questo file esporta la configurazione Next.js del progetto. Al momento è intenzionalmente vuoto oltre
 * al tipo NextConfig: l'app non richiede rewrite custom, immagini remote, experimental flags o altre opzioni
 * perché le API vivono già sotto app/api come route native App Router, il frontend è CSR con "use client",
 * e Prisma/PostgreSQL sono consumati solo lato server nelle route. Mantenerlo minimale evita complessità
 * inutile; eventuali future esigenze (es. headers sicurezza, redirect HTTPS in produzione) si aggiungono qui
 * senza toccare il codice applicativo.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
