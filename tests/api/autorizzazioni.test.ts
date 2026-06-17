/**
 * Questo file contiene test unitari sulle funzioni pure in lib/rimborso-rules.ts, senza database né HTTP,
 * verificando ogni combinazione ruolo/stato/proprietario per puoVedere, puoModificare, puoEliminare,
 * puoApprovare, puoRifiutare e puoLiquidare. Usa TokenPayload e richieste mock in memoria per simulare
 * dipendente proprietario, altro dipendente, admin e richieste IN_ATTESA, APPROVATA, RIFIUTATA. Separare
 * questi test dalla integrazione in rimborsi.test.ts permette di individuare subito regressioni nella logica
 * di business quando si modifica una regola, senza dover distinguere se il bug è nella funzione o nella route.
 * È il modo più rapido per documentare con codice i permessi richiesti dalla traccia d'esame.
 */

import { describe, it, expect } from "vitest";
import {
  puoVedereRichiesta,
  puoModificareRichiesta,
  puoEliminareRichiesta,
  puoApprovare,
  puoRifiutare,
  puoLiquidare,
} from "@/lib/rimborso-rules";
import { TokenPayload } from "@/lib/auth";
import { Ruolo, StatoRichiesta } from "@/app/generated/prisma/client";

const dipendente: TokenPayload = { userId: 1, email: "dip@azienda.it", ruolo: Ruolo.DIPENDENTE };
const altroDipendente: TokenPayload = { userId: 2, email: "altro@azienda.it", ruolo: Ruolo.DIPENDENTE };
const admin: TokenPayload = { userId: 3, email: "admin@azienda.it", ruolo: Ruolo.RESPONSABILE_AMMINISTRATIVO };

const richiestaInAttesa = {
  id: 1,
  dipendenteId: 1,
  stato: StatoRichiesta.IN_ATTESA,
  dataInserimento: new Date("2026-05-01"),
  dataValutazione: null,
};

const richiestaApprovata = {
  id: 2,
  dipendenteId: 1,
  stato: StatoRichiesta.APPROVATA,
  dataInserimento: new Date("2026-05-01"),
  dataValutazione: new Date("2026-05-05"),
};

const richiestaRifiutata = {
  id: 3,
  dipendenteId: 1,
  stato: StatoRichiesta.RIFIUTATA,
  dataInserimento: new Date("2026-05-01"),
  dataValutazione: new Date("2026-05-05"),
};

describe("Regole autorizzazione rimborsi", () => {
  it("dipendente vede solo le proprie richieste", () => {
    expect(puoVedereRichiesta(dipendente, richiestaInAttesa)).toBe(true);
    expect(puoVedereRichiesta(altroDipendente, richiestaInAttesa)).toBe(false);
  });

  it("admin vede tutte le richieste", () => {
    expect(puoVedereRichiesta(admin, richiestaInAttesa)).toBe(true);
    expect(puoVedereRichiesta(admin, { ...richiestaInAttesa, dipendenteId: 99 })).toBe(true);
  });

  it("dipendente può modificare solo proprie richieste IN_ATTESA", () => {
    expect(puoModificareRichiesta(dipendente, richiestaInAttesa)).toBe(true);
    expect(puoModificareRichiesta(dipendente, richiestaApprovata)).toBe(false);
    expect(puoModificareRichiesta(altroDipendente, richiestaInAttesa)).toBe(false);
    expect(puoModificareRichiesta(admin, richiestaInAttesa)).toBe(false);
  });

  it("dipendente può eliminare solo proprie richieste IN_ATTESA", () => {
    expect(puoEliminareRichiesta(dipendente, richiestaInAttesa)).toBe(true);
    expect(puoEliminareRichiesta(dipendente, richiestaApprovata)).toBe(false);
  });

  it("solo admin può approvare richieste IN_ATTESA", () => {
    expect(puoApprovare(admin, richiestaInAttesa)).toBe(true);
    expect(puoApprovare(dipendente, richiestaInAttesa)).toBe(false);
    expect(puoApprovare(admin, richiestaApprovata)).toBe(false);
  });

  it("solo admin può rifiutare richieste IN_ATTESA", () => {
    expect(puoRifiutare(admin, richiestaInAttesa)).toBe(true);
    expect(puoRifiutare(dipendente, richiestaInAttesa)).toBe(false);
  });

  it("solo admin può liquidare richieste APPROVATE", () => {
    expect(puoLiquidare(admin, richiestaApprovata)).toBe(true);
    expect(puoLiquidare(admin, richiestaInAttesa)).toBe(false);
    expect(puoLiquidare(admin, richiestaRifiutata)).toBe(false);
    expect(puoLiquidare(dipendente, richiestaApprovata)).toBe(false);
  });
});
