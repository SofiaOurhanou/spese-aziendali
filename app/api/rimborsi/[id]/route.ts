/**
 * Questa route gestisce le operazioni su una singola richiesta di rimborso identificata da :id
 * in /api/rimborsi/[id]. GET restituisce il dettaglio completo se l'utente può vederla (proprietario
 * dipendente o admin). PUT permette al dipendente proprietario di aggiornare una richiesta solo in
 * stato IN_ATTESA, ri-validando categoria e campi come in creazione. DELETE elimina fisicamente la
 * riga con le stesse regole di modifica. Ogni metodo delega i controlli di autorizzazione a
 * puoVedereRichiesta, puoModificareRichiesta e puoEliminareRichiesta in rimborso-rules, così la
 * logica di business resta centralizzata. Il parametro id arriva come Promise per compatibilità
 * con Next.js 15+ App Router; viene parsato a intero e usato nelle query Prisma.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isDipendente } from "@/lib/auth";
import { rimborsoUpdateSchema } from "@/lib/validations";
import { puoVedereRichiesta, puoModificareRichiesta, puoEliminareRichiesta } from "@/lib/rimborso-rules";
import { serializeRimborso, rimborsoInclude } from "@/lib/rimborso-serializer";
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/api-response";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /api/rimborsi/{id}:
 *   get:
 *     summary: Dettaglio richiesta di rimborso
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dettaglio richiesta
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const rimborsoId = parseInt(id);

    const rimborso = await prisma.richiestaRimborso.findUnique({
      where: { id: rimborsoId },
      include: rimborsoInclude,
    });

    if (!rimborso) return notFound("Richiesta non trovata");

    if (!puoVedereRichiesta(user, rimborso)) {
      return forbidden("Non puoi visualizzare questa richiesta");
    }

    return ok(serializeRimborso(rimborso));
  } catch (error) {
    console.error("Errore dettaglio rimborso:", error);
    return serverError();
  }
}

/**
 * @swagger
 * /api/rimborsi/{id}:
 *   put:
 *     summary: Modifica richiesta (solo IN_ATTESA, solo dipendente proprietario)
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    if (!isDipendente(user)) {
      return forbidden("Solo i dipendenti possono modificare le proprie richieste");
    }

    const { id } = await params;
    const rimborsoId = parseInt(id);

    const rimborso = await prisma.richiestaRimborso.findUnique({
      where: { id: rimborsoId },
    });

    if (!rimborso) return notFound("Richiesta non trovata");

    if (!puoModificareRichiesta(user, rimborso)) {
      return forbidden("Non puoi modificare questa richiesta");
    }

    const body = await request.json();
    const parsed = rimborsoUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Dati non validi", parsed.error.flatten().fieldErrors);
    }

    const { dataSpesa, categoriaId, importo, descrizione, riferimentoGiustificativo } = parsed.data;

    const categoria = await prisma.categoriaSpesa.findUnique({ where: { id: categoriaId } });
    if (!categoria) {
      return badRequest("Categoria non trovata");
    }

    const aggiornato = await prisma.richiestaRimborso.update({
      where: { id: rimborsoId },
      data: {
        dataSpesa: new Date(dataSpesa),
        categoriaId,
        importo,
        descrizione: descrizione.trim(),
        riferimentoGiustificativo: riferimentoGiustificativo?.trim() || null,
      },
      include: rimborsoInclude,
    });

    return ok(serializeRimborso(aggiornato));
  } catch (error) {
    console.error("Errore modifica rimborso:", error);
    return serverError();
  }
}

/**
 * @swagger
 * /api/rimborsi/{id}:
 *   delete:
 *     summary: Elimina richiesta (solo IN_ATTESA, solo dipendente proprietario)
 *     tags: [Rimborsi]
 *     security:
 *       - bearerAuth: []
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    if (!isDipendente(user)) {
      return forbidden("Solo i dipendenti possono eliminare le proprie richieste");
    }

    const { id } = await params;
    const rimborsoId = parseInt(id);

    const rimborso = await prisma.richiestaRimborso.findUnique({
      where: { id: rimborsoId },
    });

    if (!rimborso) return notFound("Richiesta non trovata");

    if (!puoEliminareRichiesta(user, rimborso)) {
      return forbidden("Non puoi eliminare questa richiesta");
    }

    await prisma.richiestaRimborso.delete({ where: { id: rimborsoId } });

    return ok({ message: "Richiesta eliminata con successo" });
  } catch (error) {
    console.error("Errore eliminazione rimborso:", error);
    return serverError();
  }
}
