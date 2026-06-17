/**
 * Questa route implementa PUT /api/rimborsi/[id]/approva, azione riservata al responsabile
 * amministrativo sul flusso di valutazione delle spese. Dopo autenticazione e verifica ruolo admin,
 * carica la richiesta e usa puoApprovare per assicurarsi che sia IN_ATTESA (non si può approvare
 * qualcosa già rifiutato, approvato o liquidato). La data di valutazione è impostata a "adesso" e
 * deve essere >= dataInserimento come da regola di business in rimborso-rules; si registra anche
 * responsabileValutazioneId per tracciare chi ha approvato. Lo stato passa ad APPROVATA, eventuale
 * motivazioneRifiuto precedente viene azzerata, e la risposta è il rimborso serializzato aggiornato
 * per aggiornare subito la UI del dettaglio senza un secondo GET.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isAdmin } from "@/lib/auth";
import { puoApprovare, dataValutazioneValida } from "@/lib/rimborso-rules";
import { serializeRimborso, rimborsoInclude } from "@/lib/rimborso-serializer";
import { ok, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-response";
import { StatoRichiesta } from "@/app/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/rimborsi/{id}/approva:
 *   put:
 *     summary: Approva una richiesta in attesa (solo admin)
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();
    if (!isAdmin(user)) return forbidden("Solo il responsabile amministrativo può approvare");

    const { id } = await params;
    const rimborsoId = parseInt(id);

    const rimborso = await prisma.richiestaRimborso.findUnique({
      where: { id: rimborsoId },
    });

    if (!rimborso) return notFound("Richiesta non trovata");
    if (!puoApprovare(user, rimborso)) {
      return forbidden("Questa richiesta non può essere approvata");
    }

    const dataValutazione = new Date();
    if (!dataValutazioneValida(rimborso.dataInserimento, dataValutazione)) {
      return badRequest("Data di valutazione non valida");
    }

    const aggiornato = await prisma.richiestaRimborso.update({
      where: { id: rimborsoId },
      data: {
        stato: StatoRichiesta.APPROVATA,
        dataValutazione,
        responsabileValutazioneId: user.userId,
        motivazioneRifiuto: null,
      },
      include: rimborsoInclude,
    });

    return ok(serializeRimborso(aggiornato));
  } catch (error) {
    console.error("Errore approvazione:", error);
    return serverError();
  }
}
