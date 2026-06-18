import { z } from "zod";
import { Ruolo, StatoRichiesta } from "@/app/generated/prisma/client";

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

export function isValidMese(mese: string): boolean {
  return /^\d{4}-\d{2}$/.test(mese);
}
