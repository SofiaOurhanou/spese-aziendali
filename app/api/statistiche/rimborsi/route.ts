import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isAdmin } from "@/lib/auth";
import { isValidMese } from "@/lib/validations";
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-response";
import { StatoRichiesta, Prisma } from "@/app/generated/prisma/client";

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
