/**
 * Questo file testa il layer di autenticazione su due livelli: validazione Zod pura (registerSchema e
 * loginSchema con casi validi, password diverse, email malformata, campi solo spazi) e integrazione delle
 * route POST register/login contro il database reale. Verifica che la registrazione crei utente e restituisca
 * token 201, rifiuti email duplicate del seed (mario.rossi), che il login con Password123! funzioni e che
 * password errata dia 401. Usa email univoca con timestamp per il test di creazione e pulisce con delete
 * Prisma dopo, così i test sono ripetibili senza sporcare il dataset. È la rete di sicurezza sul primo
 * punto di ingresso dell'applicazione.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validations";
import { POST as registerPOST } from "@/app/api/utenti/register/route";
import { POST as loginPOST } from "@/app/api/utenti/login/route";
import { createRequest } from "../helpers";
import { prisma } from "@/lib/prisma";

describe("Validazioni autenticazione", () => {
  it("registerSchema accetta dati validi", () => {
    const result = registerSchema.safeParse({
      nome: "Test",
      cognome: "Utente",
      email: "test@example.com",
      password: "password123",
      confermaPassword: "password123",
      ruolo: "DIPENDENTE",
    });
    expect(result.success).toBe(true);
  });

  it("registerSchema rifiuta password diverse", () => {
    const result = registerSchema.safeParse({
      nome: "Test",
      cognome: "Utente",
      email: "test@example.com",
      password: "password123",
      confermaPassword: "diversa",
      ruolo: "DIPENDENTE",
    });
    expect(result.success).toBe(false);
  });

  it("registerSchema rifiuta email non valida", () => {
    const result = registerSchema.safeParse({
      nome: "Test",
      cognome: "Utente",
      email: "non-valida",
      password: "password123",
      confermaPassword: "password123",
      ruolo: "DIPENDENTE",
    });
    expect(result.success).toBe(false);
  });

  it("registerSchema rifiuta campi solo spazi", () => {
    const result = registerSchema.safeParse({
      nome: "   ",
      cognome: "Utente",
      email: "test@example.com",
      password: "password123",
      confermaPassword: "password123",
      ruolo: "DIPENDENTE",
    });
    expect(result.success).toBe(false);
  });

  it("loginSchema accetta email e password", () => {
    const result = loginSchema.safeParse({
      email: "mario.rossi@azienda.it",
      password: "Password123!",
    });
    expect(result.success).toBe(true);
  });
});

describe("API autenticazione", () => {
  const emailTest = `test-vitest-${Date.now()}@example.com`;

  it("POST /api/utenti/register crea un nuovo utente", async () => {
    const req = createRequest("/api/utenti/register", {
      method: "POST",
      body: {
        nome: "Vitest",
        cognome: "Test",
        email: emailTest,
        password: "Password123!",
        confermaPassword: "Password123!",
        ruolo: "DIPENDENTE",
      },
    });

    const res = await registerPOST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe(emailTest);
    expect(data.user.ruolo).toBe("DIPENDENTE");

    // Pulizia
    await prisma.utente.delete({ where: { email: emailTest } });
  });

  it("POST /api/utenti/register rifiuta email duplicata", async () => {
    const req = createRequest("/api/utenti/register", {
      method: "POST",
      body: {
        nome: "Mario",
        cognome: "Rossi",
        email: "mario.rossi@azienda.it",
        password: "Password123!",
        confermaPassword: "Password123!",
        ruolo: "DIPENDENTE",
      },
    });

    const res = await registerPOST(req);
    expect(res.status).toBe(400);
  });

  it("POST /api/utenti/login con credenziali corrette", async () => {
    const req = createRequest("/api/utenti/login", {
      method: "POST",
      body: {
        email: "mario.rossi@azienda.it",
        password: "Password123!",
      },
    });

    const res = await loginPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.nome).toBe("Mario");
  });

  it("POST /api/utenti/login con password errata", async () => {
    const req = createRequest("/api/utenti/login", {
      method: "POST",
      body: {
        email: "mario.rossi@azienda.it",
        password: "sbagliata",
      },
    });

    const res = await loginPOST(req);
    expect(res.status).toBe(401);
  });
});
