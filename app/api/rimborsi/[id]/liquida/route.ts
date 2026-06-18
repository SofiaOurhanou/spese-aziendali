import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isAdmin } from "@/lib/auth";
import { puoLiquidare, dataLiquidazioneValida } from "@/lib/rimborso-rules";
import { serializeRimborso, rimborsoInclude } from "@/lib/rimborso-serializer";
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-response";
import { StatoRichiesta } from "@/app/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();
    if (!isAdmin(user)) return forbidden("Solo il responsabile amministrativo può liquidare");

    const { id } = await params;
    const rimborsoId = parseInt(id);

    const rimborso = await prisma.richiestaRimborso.findUnique({
      where: { id: rimborsoId },
    });

    if (!rimborso) return notFound("Richiesta non trovata");
    if (!puoLiquidare(user, rimborso)) {
      return forbidden("Solo le richieste approvate possono essere liquidate");
    }

    const dataLiquidazione = new Date();
    if (!dataLiquidazioneValida(rimborso.dataValutazione, dataLiquidazione)) {
      return badRequest("Data di liquidazione non valida");
    }

    const aggiornato = await prisma.richiestaRimborso.update({
      where: { id: rimborsoId },
      data: {
        stato: StatoRichiesta.LIQUIDATA,
        dataLiquidazione,
      },
      include: rimborsoInclude,
    });

    return ok(serializeRimborso(aggiornato));
  } catch (error) {
    console.error("Errore liquidazione:", error);
    return serverError();
  }
}
