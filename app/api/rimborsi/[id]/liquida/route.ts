/**
 * Questa route implementa PUT /api/rimborsi/[id]/liquida, ultimo passo del ciclo di vita di una
 * richiesta: registra che il rimborso approvato è stato effettivamente pagato al dipendente. Solo
 * l'admin può invocarla e solo su richieste in stato APPROVATA (puoLiquidare in rimborso-rules),
 * perché liquidare qualcosa non ancora approvato o già rifiutato non avrebbe senso contabile.
 * dataLiquidazione è impostata a now e deve essere >= dataValutazione, garantendo coerenza temporale
 * del processo inserimento → valutazione → pagamento. Lo stato diventa LIQUIDATA; non si modificano
 * altri campi della valutazione. Questa separazione in tre endpoint distinti (approva/rifiuta/liquida)
 * rende esplicito il workflow a stati finiti richiesto dalla prova pratica.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isAdmin } from "@/lib/auth";
import { puoLiquidare, dataLiquidazioneValida } from "@/lib/rimborso-rules";
import { serializeRimborso, rimborsoInclude } from "@/lib/rimborso-serializer";
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-response";
import { StatoRichiesta } from "@/app/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/rimborsi/{id}/liquida:
 *   put:
 *     summary: Registra liquidazione di una richiesta approvata (solo admin)
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 */
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
