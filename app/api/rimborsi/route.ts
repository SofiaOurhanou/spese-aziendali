/**
 * Questo file gestisce la raccolta e la creazione delle richieste di rimborso su /api/rimborsi.
 * GET elenca le richieste applicando filtri opzionali (stato, categoriaId, mese YYYY-MM, e per
 * l'admin anche dipendenteId): la funzione buildFiltri costruisce il where Prisma rispettando il
 * vincolo che un dipendente vede solo le proprie righe mentre l'admin vede l'intero dataset. POST
 * crea una nuova richiesta solo per utenti con ruolo DIPENDENTE, valida i dati con rimborsoCreateSchema,
 * verifica che la categoria esista, imposta stato IN_ATTESA e dataInserimento automatica, poi
 * restituisce il rimborso serializzato con relazioni. Entrambi gli handler richiedono JWT via
 * getUserFromRequest e usano rimborsoInclude/serializeRimborso per risposte uniformi al frontend.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isDipendente } from "@/lib/auth";
import { rimborsoCreateSchema, rimborsoUpdateSchema, isValidMese } from "@/lib/validations";
import {
  puoModificareRichiesta,
  puoEliminareRichiesta,
} from "@/lib/rimborso-rules";
import { serializeRimborso, rimborsoInclude } from "@/lib/rimborso-serializer";
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/api-response";
import { Ruolo, StatoRichiesta, Prisma } from "@/app/generated/prisma/client";

// Costruisce i filtri per la lista rimborsi in base ai query params
function buildFiltri(request: NextRequest, userId: number, isAdmin: boolean) {
  const params = request.nextUrl.searchParams;
  const where: Prisma.RichiestaRimborsoWhereInput = {};

  // Il dipendente vede solo le proprie richieste
  if (!isAdmin) {
    where.dipendenteId = userId;
  } else {
    const dipendenteId = params.get("dipendenteId");
    if (dipendenteId) {
      where.dipendenteId = parseInt(dipendenteId);
    }
  }

  const stato = params.get("stato");
  if (stato && Object.values(StatoRichiesta).includes(stato as StatoRichiesta)) {
    where.stato = stato as StatoRichiesta;
  }

  const categoriaId = params.get("categoriaId");
  if (categoriaId) {
    where.categoriaId = parseInt(categoriaId);
  }

  const mese = params.get("mese");
  if (mese && isValidMese(mese)) {
    const [anno, m] = mese.split("-").map(Number);
    const inizioMese = new Date(anno, m - 1, 1);
    const fineMese = new Date(anno, m, 0, 23, 59, 59);
    where.dataSpesa = { gte: inizioMese, lte: fineMese };
  }

  return where;
}

/**
 * @swagger
 * /api/rimborsi:
 *   get:
 *     summary: Elenco richieste di rimborso con filtri
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stato
 *         schema: { type: string, enum: [IN_ATTESA, APPROVATA, RIFIUTATA, LIQUIDATA] }
 *       - in: query
 *         name: categoriaId
 *         schema: { type: integer }
 *       - in: query
 *         name: mese
 *         schema: { type: string, example: "2026-05" }
 *       - in: query
 *         name: dipendenteId
 *         schema: { type: integer }
 *         description: Solo per responsabile amministrativo
 *     responses:
 *       200:
 *         description: Lista richieste
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    const isAdmin = user.ruolo === Ruolo.RESPONSABILE_AMMINISTRATIVO;
    const where = buildFiltri(request, user.userId, isAdmin);

    const rimborsi = await prisma.richiestaRimborso.findMany({
      where,
      include: rimborsoInclude,
      orderBy: { dataInserimento: "desc" },
    });

    return ok(rimborsi.map(serializeRimborso));
  } catch (error) {
    console.error("Errore lista rimborsi:", error);
    return serverError();
  }
}

/**
 * @swagger
 * /api/rimborsi:
 *   post:
 *     summary: Crea nuova richiesta di rimborso
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dataSpesa, categoriaId, importo, descrizione]
 *             properties:
 *               dataSpesa: { type: string, format: date }
 *               categoriaId: { type: integer }
 *               importo: { type: number }
 *               descrizione: { type: string }
 *               riferimentoGiustificativo: { type: string }
 *     responses:
 *       201:
 *         description: Richiesta creata
 */
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    // Solo i dipendenti possono creare richieste
    if (!isDipendente(user)) {
      return forbidden("Solo i dipendenti possono creare richieste di rimborso");
    }

    const body = await request.json();
    const parsed = rimborsoCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Dati non validi", parsed.error.flatten().fieldErrors);
    }

    const { dataSpesa, categoriaId, importo, descrizione, riferimentoGiustificativo } = parsed.data;

    // Verifica che la categoria esista
    const categoria = await prisma.categoriaSpesa.findUnique({ where: { id: categoriaId } });
    if (!categoria) {
      return badRequest("Categoria non trovata");
    }

    const rimborso = await prisma.richiestaRimborso.create({
      data: {
        dataSpesa: new Date(dataSpesa),
        categoriaId,
        importo,
        descrizione: descrizione.trim(),
        riferimentoGiustificativo: riferimentoGiustificativo?.trim() || null,
        dipendenteId: user.userId,
        stato: StatoRichiesta.IN_ATTESA,
      },
      include: rimborsoInclude,
    });

    return ok(serializeRimborso(rimborso), 201);
  } catch (error) {
    console.error("Errore creazione rimborso:", error);
    return serverError();
  }
}
