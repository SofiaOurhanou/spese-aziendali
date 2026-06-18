import { Ruolo, StatoRichiesta } from "@/app/generated/prisma/client";
import { TokenPayload } from "./auth";

type RichiestaConDipendente = {
  id: number;
  dipendenteId: number;
  stato: StatoRichiesta;
  dataInserimento: Date;
  dataValutazione: Date | null;
};

export function puoVedereRichiesta(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  if (user.ruolo === Ruolo.RESPONSABILE_AMMINISTRATIVO) return true;
  return richiesta.dipendenteId === user.userId;
}

export function puoModificareRichiesta(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  if (user.ruolo !== Ruolo.DIPENDENTE) return false;
  if (richiesta.dipendenteId !== user.userId) return false;
  return richiesta.stato === StatoRichiesta.IN_ATTESA;
}

export function puoEliminareRichiesta(user: TokenPayload, richiesta: RichiestaConDipendente): boolean {
  return puoModificareRichiesta(user, richiesta);
}

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

export function dataValutazioneValida(dataInserimento: Date, dataValutazione: Date): boolean {
  return dataValutazione >= dataInserimento;
}

export function dataLiquidazioneValida(dataValutazione: Date | null, dataLiquidazione: Date): boolean {
  if (!dataValutazione) return false;
  return dataLiquidazione >= dataValutazione;
}

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
