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

function buildFiltri(request: NextRequest, userId: number, isAdmin: boolean) {
  const params = request.nextUrl.searchParams;
  const where: Prisma.RichiestaRimborsoWhereInput = {};

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

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    if (!isDipendente(user)) {
      return forbidden("Solo i dipendenti possono creare richieste di rimborso");
    }

    const body = await request.json();
    const parsed = rimborsoCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Dati non validi", parsed.error.flatten().fieldErrors);
    }

    const { dataSpesa, categoriaId, importo, descrizione, riferimentoGiustificativo } = parsed.data;

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
