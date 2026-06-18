import { describe, it, expect, beforeAll } from "vitest";
import { POST as loginPOST } from "@/app/api/utenti/login/route";
import { GET as getStatistiche } from "@/app/api/statistiche/rimborsi/route";
import { createRequest } from "../helpers";

async function getToken(email: string, password: string): Promise<string> {
  const req = createRequest("/api/utenti/login", {
    method: "POST",
    body: { email, password },
  });
  const res = await loginPOST(req);
  const data = await res.json();
  return data.token;
}

describe("API Statistiche", () => {
  let tokenAdmin: string;
  let tokenDipendente: string;

  beforeAll(async () => {
    tokenAdmin = await getToken("admin.verdi@azienda.it", "Password123!");
    tokenDipendente = await getToken("mario.rossi@azienda.it", "Password123!");
  });

  it("admin può vedere le statistiche", async () => {
    const req = createRequest("/api/statistiche/rimborsi", { token: tokenAdmin });
    const res = await getStatistiche(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);

    if (data.length > 0) {
      const prima = data[0];
      expect(prima).toHaveProperty("mese");
      expect(prima).toHaveProperty("categoria");
      expect(prima).toHaveProperty("numeroRichieste");
      expect(prima).toHaveProperty("totaleRichiesto");
      expect(prima).toHaveProperty("totaleApprovato");
      expect(prima).toHaveProperty("totaleLiquidato");
    }
  });

  it("dipendente NON può vedere le statistiche", async () => {
    const req = createRequest("/api/statistiche/rimborsi", { token: tokenDipendente });
    const res = await getStatistiche(req);
    expect(res.status).toBe(403);
  });

  it("filtro per mese funziona", async () => {
    const req = createRequest("/api/statistiche/rimborsi?mese=2026-05", { token: tokenAdmin });
    const res = await getStatistiche(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    for (const s of data) {
      expect(s.mese).toBe("2026-05");
    }
  });

  it("senza token restituisce 401", async () => {
    const req = createRequest("/api/statistiche/rimborsi");
    const res = await getStatistiche(req);
    expect(res.status).toBe(401);
  });
});
