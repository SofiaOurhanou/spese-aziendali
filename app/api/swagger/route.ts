/**
 * Questa route minimale espone GET /api/swagger restituendo il JSON della specifica OpenAPI generata
 * da getSwaggerSpec() in lib/swagger.ts. Esiste come endpoint separato (anziché incorporare lo spec
 * nella pagina React) perché Swagger UI si aspetta un URL da cui scaricare la definizione, e così
 * la stessa specifica può essere consumata anche da client esterni, Postman o strumenti di codegen.
 * Non richiede autenticazione: documentare le API pubblicamente facilita sviluppo e valutazione
 * della prova. La logica di composizione dello spec resta in lib/swagger; qui si limita a serializzarla
 * in JSON con NextResponse, mantenendo la route sottile e facile da mantenere.
 */

import { getSwaggerSpec } from "@/lib/swagger";
import { NextResponse } from "next/server";

export async function GET() {
  const spec = getSwaggerSpec();
  return NextResponse.json(spec);
}
