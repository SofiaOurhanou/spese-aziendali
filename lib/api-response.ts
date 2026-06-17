/**
 * Questo modulo centralizza tutte le risposte HTTP delle API REST dell'applicazione, perché
 * senza un formato condiviso ogni route finirebbe per inventare strutture diverse (a volte
 * solo una stringa, a volte un oggetto con chiavi diverse) e il frontend dovrebbe gestire
 * eccezioni caso per caso. Qui ogni helper restituisce sempre un JSON con almeno il campo
 * `message` in caso di errore, e il payload utile in caso di successo, usando i codici HTTP
 * semanticamente corretti: 200/201 per ok, 400 per input non validi, 401 per mancanza di
 * autenticazione, 403 per permessi insufficienti, 404 per risorse inesistenti e 500 per errori
 * imprevisti. La scelta di wrappare NextResponse.json in funzioni dedicate serve anche a
 * ridurre il boilerplate nelle route e a rendere esplicita l'intenzione di ogni risposta,
 * facilitando sia la lettura del codice sia l'allineamento con la documentazione Swagger.
 */

import { NextResponse } from "next/server";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function badRequest(message: string, errors?: unknown) {
  return NextResponse.json({ message, errors }, { status: 400 });
}

export function unauthorized(message = "Non autenticato") {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = "Operazione non consentita") {
  return NextResponse.json({ message }, { status: 403 });
}

export function notFound(message = "Risorsa non trovata") {
  return NextResponse.json({ message }, { status: 404 });
}

export function serverError(message = "Errore interno del server") {
  return NextResponse.json({ message }, { status: 500 });
}
