/**
 * Questo modulo fa da ponte tra il modello Prisma (Date, Decimal, relazioni annidate) e il JSON
 * che consumano frontend e documentazione OpenAPI. Prisma restituisce `importo` come Decimal e le
 * date come oggetti Date non serializzabili direttamente in JSON; qui si convertono in number e
 * stringhe ISO, e si aggiunge `statoLabel` leggibile. `rimborsoInclude` definisce l'include Prisma
 * standard (categoria, dipendente con campi minimi, responsabile valutazione) usato da tutte le
 * query sui rimborsi, così ogni endpoint restituisce la stessa forma dati senza rischiare di
 * dimenticare relazioni utili al dettaglio o alla lista. Separare serializzazione e query tiene
 * le route API focalizzate su autorizzazione e persistenza piuttosto che su mapping manuale.
 */

import { RichiestaRimborso, CategoriaSpesa, Utente } from "@/app/generated/prisma/client";
import { statiLabel } from "./rimborso-rules";

type RichiestaCompleta = RichiestaRimborso & {
  categoria: CategoriaSpesa;
  dipendente: Pick<Utente, "id" | "nome" | "cognome" | "email">;
  responsabileValutazione?: Pick<Utente, "id" | "nome" | "cognome"> | null;
};

// Converte Decimal in number per il JSON
export function serializeRimborso(r: RichiestaCompleta) {
  return {
    id: r.id,
    dataInserimento: r.dataInserimento.toISOString(),
    dataSpesa: r.dataSpesa.toISOString().split("T")[0],
    importo: Number(r.importo),
    descrizione: r.descrizione,
    riferimentoGiustificativo: r.riferimentoGiustificativo,
    stato: r.stato,
    statoLabel: statiLabel[r.stato],
    categoria: {
      id: r.categoria.id,
      descrizione: r.categoria.descrizione,
    },
    dipendente: {
      id: r.dipendente.id,
      nome: r.dipendente.nome,
      cognome: r.dipendente.cognome,
      email: r.dipendente.email,
    },
    dataValutazione: r.dataValutazione?.toISOString() ?? null,
    responsabileValutazione: r.responsabileValutazione
      ? {
          id: r.responsabileValutazione.id,
          nome: r.responsabileValutazione.nome,
          cognome: r.responsabileValutazione.cognome,
        }
      : null,
    motivazioneRifiuto: r.motivazioneRifiuto,
    dataLiquidazione: r.dataLiquidazione?.toISOString() ?? null,
  };
}

// Include usato nelle query Prisma per avere sempre gli stessi dati
export const rimborsoInclude = {
  categoria: true,
  dipendente: {
    select: { id: true, nome: true, cognome: true, email: true },
  },
  responsabileValutazione: {
    select: { id: true, nome: true, cognome: true },
  },
};
