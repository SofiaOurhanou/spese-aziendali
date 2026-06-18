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
