/**
 * Questo modulo fornisce createRequest, factory per costruire oggetti NextRequest usati nei test delle
 * API route senza avviare un server HTTP reale. Accetta path relativo (es. /api/rimborsi), metodo,
 * body JSON opzionale e token JWT opzionale che viene tradotto nell'header Authorization Bearer, replicando
 * esattamente ciò che fa axios-client in produzione. I test importano direttamente le funzioni POST/GET
 * esportate dalle route e le invocano con queste richieste mock, permettendo test di integrazione veloci
 * e deterministici contro Prisma e il database seedato. L'URL base localhost:3000 è convenzione interna
 * perché NextRequest richiede un URL assoluto anche se l'host non viene contattato.
 */

import { NextRequest } from "next/server";

export function createRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
  } = {}
): NextRequest {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = {
    method,
    headers,
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(`http://localhost:3000${url}`, init);
}
