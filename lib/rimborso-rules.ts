/**
 * Questo file raccoglie tutte le regole di business e autorizzazione sul ciclo di vita di una
 * richiesta di rimborso, estratte dalle API in funzioni pure testabili. La traccia d'esame impone
 * vincoli precisi: un dipendente vede e modifica solo le proprie richieste e solo se IN_ATTESA;
 * il responsabile amministrativo vede tutto, approva/rifiuta solo IN_ATTESA e liquida solo
 * APPROVATA; le date di valutazione e liquidazione devono essere coerenti con le date precedenti.
 * Centralizzare qui evita duplicazione e divergenze tra GET, PUT, DELETE e le route approva/rifiuta/
 * liquida, e permette test unitari mirati (autorizzazioni.test.ts) senza database. `statiLabel` e
 * `ruoliLabel` traducono gli enum Prisma in italiano per l'interfaccia utente.
 */

import { Ruolo, StatoRichiesta } from "@/app/generated/prisma/client";
import { TokenPayload } from "./auth";

type RichiestaConDipendente = {
  id: number;
  dipendenteId: number;
  stato: StatoRichiesta;
  dataInserimento: Date;
  dataValutazione: Date | null;
};

// Un dipendente può vedere solo le proprie richieste
export function puoVedereRichiesta(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  if (user.ruolo === Ruolo.RESPONSABILE_AMMINISTRATIVO) return true;
  return richiesta.dipendenteId === user.userId;
}

// Modifica ed eliminazione solo se IN_ATTESA e di proprietà del dipendente
export function puoModificareRichiesta(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  if (user.ruolo !== Ruolo.DIPENDENTE) return false;
  if (richiesta.dipendenteId !== user.userId) return false;
  return richiesta.stato === StatoRichiesta.IN_ATTESA;
}

export function puoEliminareRichiesta(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  return puoModificareRichiesta(user, richiesta);
}

// Solo admin può approvare/rifiutare/liquidare
export function puoApprovare(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  if (user.ruolo !== Ruolo.RESPONSABILE_AMMINISTRATIVO) return false;
  return richiesta.stato === StatoRichiesta.IN_ATTESA;
}

export function puoRifiutare(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  return puoApprovare(user, richiesta);
}

export function puoLiquidare(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  if (user.ruolo !== Ruolo.RESPONSABILE_AMMINISTRATIVO) return false;
  return richiesta.stato === StatoRichiesta.APPROVATA;
}

// Controlli sulle date come da traccia
export function dataValutazioneValida(dataInserimento: Date, dataValutazione: Date): boolean {
  return dataValutazione >= dataInserimento;
}

export function dataLiquidazioneValida(dataValutazione: Date | null, dataLiquidazione: Date): boolean {
  if (!dataValutazione) return false;
  return dataLiquidazione >= dataValutazione;
}

// Etichette italiane per gli stati (usate nel frontend)
export const statiLabel: Record<StatoRichiesta, string> = {
  IN_ATTESA: "In attesa",
  APPROVATA: "Approvata",
  RIFIUTATA: "Rifiutata",
  LIQUIDATA: "Liquidata",
};

export const ruoliLabel: Record<Ruolo, string> = {
  DIPENDENTE: "Dipendente",
  RESPONSABILE_AMMINISTRATIVO: "Responsabile amministrativo",
};
