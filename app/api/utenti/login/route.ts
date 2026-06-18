import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dati non validi", parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;

    const utente = await prisma.utente.findUnique({ where: { email } });
    if (!utente) {
      return unauthorized("Email o password non corretti");
    }

    const passwordOk = await verifyPassword(password, utente.password);
    if (!passwordOk) {
      return unauthorized("Email o password non corretti");
    }

    const token = signToken({ userId: utente.id, email: utente.email, ruolo: utente.ruolo });

    return ok({
      token,
      user: {
        id: utente.id,
        nome: utente.nome,
        cognome: utente.cognome,
        email: utente.email,
        ruolo: utente.ruolo,
      },
    });
  } catch (error) {
    console.error("Errore login:", error);
    return serverError();
  }
}
