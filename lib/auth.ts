/**
 * Questo file è il cuore dell'autenticazione lato server: gestisce password, token JWT e
 * estrazione dell'utente dalle richieste HTTP. Le password non vengono mai salvate in chiaro
 * nel database (bcrypt con cost factor 10), e dopo login o registrazione si emette un JWT
 * firmato con una chiave segreta che contiene userId, email e ruolo, valido 24 ore. Il
 * frontend salva quel token nel localStorage e lo invia nell'header Authorization come Bearer;
 * qui `getUserFromRequest` lo legge e lo verifica in ogni API protetta. Usare JWT stateless
 * evita sessioni server-side e si adatta bene a Next.js API Routes, mentre `isAdmin` e
 * `isDipendente` incapsulano i controlli sul ruolo richiesti dalla traccia d'esame (dipendente
 * vs responsabile amministrativo). In produzione JWT_SECRET deve stare in .env: il fallback
 * hardcoded esiste solo per lo sviluppo locale.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { Ruolo } from "@/app/generated/prisma/client";

export type TokenPayload = {
  userId: number;
  email: string;
  ruolo: Ruolo;
};

const JWT_SECRET = process.env.JWT_SECRET || "chiave-segreta-dev-cambiami-in-produzione";
const JWT_EXPIRES_IN = "24h";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export function isAdmin(user: TokenPayload): boolean {
  return user.ruolo === Ruolo.RESPONSABILE_AMMINISTRATIVO;
}

export function isDipendente(user: TokenPayload): boolean {
  return user.ruolo === Ruolo.DIPENDENTE;
}
