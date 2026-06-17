/**
 * Questo file contiene gli schemi Zod che validano l'input di tutte le API lato server, perché
 * non si può fidare ciò che arriva dal browser: i controlli HTML sono aggirabili e la sicurezza
 * deve essere enforced nel backend. Ogni schema rispecchia i campi richiesti dalla traccia
 * (registrazione con conferma password, creazione rimborso con importo positivo, ecc.) e usa
 * `nonVuoto` per rifiutare stringhe di soli spazi, caso esplicitamente citato nella prova.
 * `safeParse` nelle route produce errori strutturati per campo restituiti con badRequest. Gli
 * enum Ruolo e StatoRichiesta sono legati a Prisma per non divergere dal database. `isValidMese`
 * valida il formato YYYY-MM dei filtri per mese su liste e statistiche.
 */

import { z } from "zod";
import { Ruolo, StatoRichiesta } from "@/app/generated/prisma/client";

// Controlla che una stringa non sia vuota o solo spazi
const nonVuoto = (campo: string) =>
  z
    .string()
    .min(1, `${campo} obbligatorio`)
    .refine((val) => val.trim().length > 0, `${campo} non può essere solo spazi`);

export const registerSchema = z
  .object({
    nome: nonVuoto("Nome"),
    cognome: nonVuoto("Cognome"),
    email: z.string().email("Email non valida"),
    password: z.string().min(6, "Password minimo 6 caratteri"),
    confermaPassword: z.string(),
    ruolo: z.nativeEnum(Ruolo, { message: "Ruolo non valido" }),
  })
  .refine((data) => data.password === data.confermaPassword, {
    message: "Le password non coincidono",
    path: ["confermaPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password obbligatoria"),
});

export const rimborsoCreateSchema = z.object({
  dataSpesa: z.string().min(1, "Data spesa obbligatoria"),
  categoriaId: z.coerce.number().int().positive("Categoria obbligatoria"),
  importo: z.coerce.number().positive("Importo deve essere maggiore di zero"),
  descrizione: nonVuoto("Descrizione"),
  riferimentoGiustificativo: z
    .string()
    .optional()
    .refine((val) => !val || val.trim().length > 0, "Giustificativo non può essere solo spazi"),
});

export const rimborsoUpdateSchema = rimborsoCreateSchema;

export const rifiutaSchema = z.object({
  motivazione: z.string().optional(),
});

export const statiValidi = Object.values(StatoRichiesta);

// Valida formato mese YYYY-MM per i filtri
export function isValidMese(mese: string): boolean {
  return /^\d{4}-\d{2}$/.test(mese);
}
