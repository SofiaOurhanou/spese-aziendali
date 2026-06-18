import { RichiestaRimborso, CategoriaSpesa, Utente } from "@/app/generated/prisma/client";
import { statiLabel } from "./rimborso-rules";

type RichiestaCompleta = RichiestaRimborso & {
  categoria: CategoriaSpesa;
  dipendente: Pick<Utente, "id" | "nome" | "cognome" | "email">;
  responsabileValutazione?: Pick<Utente, "id" | "nome" | "cognome"> | null;
};

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

export const rimborsoInclude = {
  categoria: true,
  dipendente: {
    select: { id: true, nome: true, cognome: true, email: true },
  },
  responsabileValutazione: {
    select: { id: true, nome: true, cognome: true },
  },
};
