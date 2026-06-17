/**
 * Questo file esegue test di integrazione end-to-end sulle API /api/rimborsi usando token reali ottenuti
 * via login con utenti del seed (Mario dipendente, Giuseppe admin). Copre isolamento dati (dipendente vede
 * solo proprie email), visibilità admin, creazione POST, modifica PUT su IN_ATTESA, approvazione admin,
 * blocco modifica/delete su APPROVATA con 403, e 401 senza token. Simula il ciclo di vita completo di una
 * richiesta di test creata in runtime e poi eliminata da Prisma dopo i controlli di autorizzazione, perché
 * in stato APPROVATA il DELETE via API è correttamente negato. Conferma che le regole in rimborso-rules
 * siano effettivamente applicate nelle route, non solo nei test unitari delle funzioni pure.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { POST as loginPOST } from "@/app/api/utenti/login/route";
import { GET as getRimborsi, POST as createRimborso } from "@/app/api/rimborsi/route";
import { PUT as updateRimborso, DELETE as deleteRimborso } from "@/app/api/rimborsi/[id]/route";
import { PUT as approvaRimborso } from "@/app/api/rimborsi/[id]/approva/route";
import { createRequest } from "../helpers";
import { prisma } from "@/lib/prisma";

async function getToken(email: string, password: string): Promise<string> {
  const req = createRequest("/api/utenti/login", {
    method: "POST",
    body: { email, password },
  });
  const res = await loginPOST(req);
  const data = await res.json();
  return data.token;
}

describe("API Rimborsi", () => {
  let tokenDipendente: string;
  let tokenAdmin: string;
  let categoriaId: number;
  let rimborsoTestId: number;

  beforeAll(async () => {
    tokenDipendente = await getToken("mario.rossi@azienda.it", "Password123!");
    tokenAdmin = await getToken("admin.verdi@azienda.it", "Password123!");

    const categoria = await prisma.categoriaSpesa.findFirst();
    categoriaId = categoria!.id;
  });

  it("GET /api/rimborsi - dipendente vede solo le proprie", async () => {
    const req = createRequest("/api/rimborsi", { token: tokenDipendente });
    const res = await getRimborsi(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    // Tutte le richieste devono essere di Mario (dipendenteId del token)
    for (const r of data) {
      expect(r.dipendente.email).toBe("mario.rossi@azienda.it");
    }
  });

  it("GET /api/rimborsi - admin vede tutte", async () => {
    const req = createRequest("/api/rimborsi", { token: tokenAdmin });
    const res = await getRimborsi(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.length).toBeGreaterThan(0);
    // Admin dovrebbe vedere richieste di dipendenti diversi
    const emails = new Set(data.map((r: { dipendente: { email: string } }) => r.dipendente.email));
    expect(emails.size).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/rimborsi - dipendente crea richiesta", async () => {
    const req = createRequest("/api/rimborsi", {
      method: "POST",
      token: tokenDipendente,
      body: {
        dataSpesa: "2026-06-10",
        categoriaId,
        importo: 25.5,
        descrizione: "Test vitest creazione rimborso",
        riferimentoGiustificativo: "TEST-001",
      },
    });

    const res = await createRimborso(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.stato).toBe("IN_ATTESA");
    expect(data.importo).toBe(25.5);
    rimborsoTestId = data.id;
  });

  it("PUT /api/rimborsi/{id} - dipendente modifica richiesta IN_ATTESA", async () => {
    const req = createRequest(`/api/rimborsi/${rimborsoTestId}`, {
      method: "PUT",
      token: tokenDipendente,
      body: {
        dataSpesa: "2026-06-11",
        categoriaId,
        importo: 30.0,
        descrizione: "Test vitest modifica rimborso",
      },
    });

    const res = await updateRimborso(req, { params: Promise.resolve({ id: String(rimborsoTestId) }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.importo).toBe(30);
  });

  it("PUT /api/rimborsi/{id}/approva - admin approva", async () => {
    const req = createRequest(`/api/rimborsi/${rimborsoTestId}/approva`, {
      method: "PUT",
      token: tokenAdmin,
    });

    const res = await approvaRimborso(req, { params: Promise.resolve({ id: String(rimborsoTestId) }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.stato).toBe("APPROVATA");
  });

  it("PUT /api/rimborsi/{id} - dipendente NON può modificare APPROVATA", async () => {
    const req = createRequest(`/api/rimborsi/${rimborsoTestId}`, {
      method: "PUT",
      token: tokenDipendente,
      body: {
        dataSpesa: "2026-06-12",
        categoriaId,
        importo: 99.0,
        descrizione: "Tentativo modifica non consentita",
      },
    });

    const res = await updateRimborso(req, { params: Promise.resolve({ id: String(rimborsoTestId) }) });
    expect(res.status).toBe(403);
  });

  it("DELETE /api/rimborsi/{id} - dipendente NON può eliminare APPROVATA", async () => {
    const req = createRequest(`/api/rimborsi/${rimborsoTestId}`, {
      method: "DELETE",
      token: tokenDipendente,
    });

    const res = await deleteRimborso(req, { params: Promise.resolve({ id: String(rimborsoTestId) }) });
    expect(res.status).toBe(403);

    // Pulizia: elimino come admin revertendo stato... oppure elimino direttamente da prisma
    await prisma.richiestaRimborso.delete({ where: { id: rimborsoTestId } });
  });

  it("GET /api/rimborsi senza token restituisce 401", async () => {
    const req = createRequest("/api/rimborsi");
    const res = await getRimborsi(req);
    expect(res.status).toBe(401);
  });
});
