import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { ok, badRequest, serverError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dati non validi", parsed.error.flatten().fieldErrors);
    }

    const { nome, cognome, email, password, ruolo } = parsed.data;

    const esistente = await prisma.utente.findUnique({ where: { email } });
    if (esistente) {
      return badRequest("Email già registrata");
    }

    const passwordHash = await hashPassword(password);

    const utente = await prisma.utente.create({
      data: { nome, cognome, email, password: passwordHash, ruolo },
    });

    const token = signToken({ userId: utente.id, email: utente.email, ruolo: utente.ruolo });

    return ok(
      {
        token,
        user: {
          id: utente.id,
          nome: utente.nome,
          cognome: utente.cognome,
          email: utente.email,
          ruolo: utente.ruolo,
        },
      },
      201
    );
  } catch (error) {
    console.error("Errore registrazione:", error);
    return serverError();
  }
}
