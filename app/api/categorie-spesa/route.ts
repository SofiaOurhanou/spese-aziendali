/**
 * Questa route espone GET /api/categorie-spesa, l'elenco delle categorie di spesa (Trasferta, Pasti,
 * ecc.) usate nei form di creazione e modifica rimborso e nei filtri delle liste. Richiede
 * autenticazione perché anche un dato apparentemente pubblico fa parte del dominio applicativo e
 * non deve essere leggibile da anonimi. Non implementa POST/PUT/DELETE: le categorie sono dati di
 * riferimento precaricati dal seed e gestiti a livello amministrativo del database, come tipico
 * nelle tracce d'esame dove l'attenzione è sul flusso rimborsi non sulla CRUD categorie. La
 * risposta è l'array grezzo dal modello CategoriaSpesa ordinato alfabeticamente per descrizione,
 * sufficiente per popolare select HTML nel RimborsoForm e nei filtri della pagina rimborsi.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api-response";

/**
 * @swagger
 * /api/categorie-spesa:
 *   get:
 *     summary: Elenco categorie di spesa disponibili
 *     tags: [Categorie]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista categorie
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    const categorie = await prisma.categoriaSpesa.findMany({
      orderBy: { descrizione: "asc" },
    });

    return ok(categorie);
  } catch (error) {
    console.error("Errore categorie:", error);
    return serverError();
  }
}
