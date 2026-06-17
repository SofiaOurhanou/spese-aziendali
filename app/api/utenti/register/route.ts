/**
 * Questa route implementa POST /api/utenti/register per creare nuovi account dipendenti o
 * responsabili amministrativi, come previsto dalla traccia che permette la scelta del ruolo in
 * fase di registrazione. Valida l'intero payload con registerSchema (campi obbligatori, email
 * valida, password minimo 6 caratteri, conferma password coincidente, ruolo enum valido), poi
 * verifica l'unicità dell'email perché è vincolo unique nello schema Prisma. La password viene
 * hashata con bcrypt prima del salvataggio: nel DB non esiste mai in chiaro. Dopo la create
 * restituisce 201 con token JWT e profilo utente, applicando lo stesso flusso del login così
 * l'utente è autenticato immediatamente dopo la registrazione senza un passaggio aggiuntivo.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { ok, badRequest, serverError } from "@/lib/api-response";

/**
 * @swagger
 * /api/utenti/register:
 *   post:
 *     summary: Registrazione nuovo utente
 *     tags: [Autenticazione]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nome, cognome, email, password, confermaPassword, ruolo]
 *             properties:
 *               nome: { type: string }
 *               cognome: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               confermaPassword: { type: string }
 *               ruolo: { type: string, enum: [DIPENDENTE, RESPONSABILE_AMMINISTRATIVO] }
 *     responses:
 *       201:
 *         description: Utente creato con token JWT
 *       400:
 *         description: Dati non validi
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Dati non validi", parsed.error.flatten().fieldErrors);
    }

    const { nome, cognome, email, password, ruolo } = parsed.data;

    // Controllo email univoca
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
