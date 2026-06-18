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
