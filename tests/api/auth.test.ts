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
