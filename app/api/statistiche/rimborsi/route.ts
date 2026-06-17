/**
 * Questa route implementa GET /api/statistiche/rimborsi, funzionalità esclusiva del responsabile
 * amministrativo richiesta dalla traccia: un riepilogo aggregato delle richieste per combinazione
 * mese (derivato da dataSpesa) e categoria, con totali richiesto, approvato e liquidato. Dopo auth
 * e controllo isAdmin, applica filtri opzionali su mese, categoriaId e dipendenteId, carica tutte
 * le richieste corrispondenti e le raggruppa in memoria con una Map (chiave mese_categoriaId). Per
 * ogni gruppo incrementa numeroRichieste e somma importi; totaleApprovato include APPROVATA e
 * LIQUIDATA, totaleLiquidato solo LIQUIDATA, distinguendo importi richiesti da quelli effettivamente
 * autorizzati e pagati. Il risultato ordinato per mese e categoria alimenta la pagina statistiche
 * con tabella e card dei totali complessivi.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isAdmin } from "@/lib/auth";
import { isValidMese } from "@/lib/validations";
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-response";
import { StatoRichiesta, Prisma } from "@/app/generated/prisma/client";

/**
 * @swagger
 * /api/statistiche/rimborsi:
 *   get:
 *     summary: Riepilogo statistiche per mese e categoria (solo admin)
 *     tags: [Statistiche]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mese
 *         schema: { type: string, example: "2026-05" }
 *       - in: query
 *         name: categoriaId
 *         schema: { type: integer }
 *       - in: query
 *         name: dipendenteId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Statistiche aggregate
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();
    if (!isAdmin(user)) return forbidden("Solo il responsabile amministrativo può vedere le statistiche");

    const params = request.nextUrl.searchParams;
    const where: Prisma.RichiestaRimborsoWhereInput = {};

    const mese = params.get("mese");
    if (mese && isValidMese(mese)) {
      const [anno, m] = mese.split("-").map(Number);
      const inizioMese = new Date(anno, m - 1, 1);
      const fineMese = new Date(anno, m, 0, 23, 59, 59);
      where.dataSpesa = { gte: inizioMese, lte: fineMese };
    }

    const categoriaId = params.get("categoriaId");
    if (categoriaId) {
      where.categoriaId = parseInt(categoriaId);
    }

    const dipendenteId = params.get("dipendenteId");
    if (dipendenteId) {
      where.dipendenteId = parseInt(dipendenteId);
    }

    const rimborsi = await prisma.richiestaRimborso.findMany({
      where,
      include: { categoria: true },
    });

    // Raggruppo per mese + categoria come da traccia
    const mappa = new Map<
      string,
      {
        mese: string;
        categoria: string;
        numeroRichieste: number;
        totaleRichiesto: number;
        totaleApprovato: number;
        totaleLiquidato: number;
      }
    >();

    for (const r of rimborsi) {
      const meseKey = `${r.dataSpesa.getFullYear()}-${String(r.dataSpesa.getMonth() + 1).padStart(2, "0")}`;
      const chiave = `${meseKey}_${r.categoriaId}`;

      if (!mappa.has(chiave)) {
        mappa.set(chiave, {
          mese: meseKey,
          categoria: r.categoria.descrizione,
          numeroRichieste: 0,
          totaleRichiesto: 0,
          totaleApprovato: 0,
          totaleLiquidato: 0,
        });
      }

      const entry = mappa.get(chiave)!;
      const importo = Number(r.importo);
      entry.numeroRichieste += 1;
      entry.totaleRichiesto += importo;

      if (r.stato === StatoRichiesta.APPROVATA || r.stato === StatoRichiesta.LIQUIDATA) {
        entry.totaleApprovato += importo;
      }
      if (r.stato === StatoRichiesta.LIQUIDATA) {
        entry.totaleLiquidato += importo;
      }
    }

    const risultato = Array.from(mappa.values()).sort((a, b) => {
      if (a.mese !== b.mese) return a.mese.localeCompare(b.mese);
      return a.categoria.localeCompare(b.categoria);
    });

    return ok(risultato);
  } catch (error) {
    console.error("Errore statistiche:", error);
    return serverError();
  }
}
