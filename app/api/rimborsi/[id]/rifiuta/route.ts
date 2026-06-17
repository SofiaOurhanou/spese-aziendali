/**
 * Questa route implementa PUT /api/rimborsi/[id]/rifiuta, complementare all'approvazione e anch'essa
 * riservata al responsabile amministrativo su richieste IN_ATTESA. Accetta un body JSON opzionale con
 * campo motivazione (validato da rifiutaSchema) che viene salvato in motivazioneRifiuto per informare
 * il dipendente del perché del diniego, requisito tipico dei processi di rimborso aziendali. Come per
 * l'approvazione, dataValutazione è la data corrente con vincolo >= dataInserimento, e
 * responsabileValutazioneId identifica l'admin che ha rifiutato. Il body vuoto o mancante è tollerato
 * grazie a catch su request.json(), perché la motivazione non è obbligatoria nella traccia. Lo stato
 * finale è RIFIUTATA e la risposta serializzata alimenta la pagina dettaglio con badge e testo rosso.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isAdmin } from "@/lib/auth";
import { rifiutaSchema } from "@/lib/validations";
import { puoRifiutare, dataValutazioneValida } from "@/lib/rimborso-rules";
import { serializeRimborso, rimborsoInclude } from "@/lib/rimborso-serializer";
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/api-response";
import { StatoRichiesta } from "@/app/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/rimborsi/{id}/rifiuta:
 *   put:
 *     summary: Rifiuta una richiesta in attesa (solo admin)
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               motivazione: { type: string }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();
    if (!isAdmin(user)) return forbidden("Solo il responsabile amministrativo può rifiutare");

    const { id } = await params;
    const rimborsoId = parseInt(id);

    const rimborso = await prisma.richiestaRimborso.findUnique({
      where: { id: rimborsoId },
    });

    if (!rimborso) return notFound("Richiesta non trovata");
    if (!puoRifiutare(user, rimborso)) {
      return forbidden("Questa richiesta non può essere rifiutata");
    }

    const body = await request.json().catch(() => ({}));
    const parsed = rifiutaSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Dati non validi", parsed.error.flatten().fieldErrors);
    }

    const dataValutazione = new Date();
    if (!dataValutazioneValida(rimborso.dataInserimento, dataValutazione)) {
      return badRequest("Data di valutazione non valida");
    }

    const aggiornato = await prisma.richiestaRimborso.update({
      where: { id: rimborsoId },
      data: {
        stato: StatoRichiesta.RIFIUTATA,
        dataValutazione,
        responsabileValutazioneId: user.userId,
        motivazioneRifiuto: parsed.data.motivazione?.trim() || null,
      },
      include: rimborsoInclude,
    });

    return ok(serializeRimborso(aggiornato));
  } catch (error) {
    console.error("Errore rifiuto:", error);
    return serverError();
  }
}
