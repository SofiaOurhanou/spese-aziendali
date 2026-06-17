/**
 * Questa route implementa POST /api/utenti/login, il punto di ingresso per utenti già registrati.
 * Riceve email e password, le valida con loginSchema (formato email, password obbligatoria), poi
 * cerca l'utente in PostgreSQL tramite Prisma. Per sicurezza non distingue tra "email inesistente"
 * e "password sbagliata": in entrambi i casi risponde 401 con lo stesso messaggio, per non rivelare
 * quali email sono nel sistema. Se le credenziali sono corrette, verifica l'hash bcrypt e genera un
 * JWT con signToken contenente id, email e ruolo. La risposta include token e oggetto user senza
 * password, così il frontend può popolare subito AuthContext e localStorage senza una seconda
 * chiamata. Gli errori imprevisti (DB down, eccezioni) finiscono in 500 con log lato server.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api-response";

/**
 * @swagger
 * /api/utenti/login:
 *   post:
 *     summary: Login utente
 *     tags: [Autenticazione]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login riuscito con token JWT
 *       401:
 *         description: Credenziali errate
 */
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
