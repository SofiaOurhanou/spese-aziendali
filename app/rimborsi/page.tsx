"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios-client";
import { useAuth } from "@/lib/auth-context";
import AlertMessage from "@/components/AlertMessage";

type Rimborso = {
  id: number;
  dataSpesa: string;
  importo: number;
  descrizione: string;
  stato: string;
  statoLabel: string;
  categoria: { id: number; descrizione: string };
  dipendente: { id: number; nome: string; cognome: string };
};

type Categoria = { id: number; descrizione: string };

const statoColori: Record<string, string> = {
  IN_ATTESA: "brutal-badge brutal-badge-warning",
  APPROVATA: "brutal-badge brutal-badge-success",
  RIFIUTATA: "brutal-badge brutal-badge-error",
  LIQUIDATA: "brutal-badge brutal-badge-info",
};

export default function RimborsiPage() {
  const { user, isLoading, isAdmin, isDipendente } = useAuth();
  const router = useRouter();

  const [rimborsi, setRimborsi] = useState<Rimborso[]>([]);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [dipendenti, setDipendenti] = useState<{ id: number; nome: string; cognome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");

  const [filtroStato, setFiltroStato] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroMese, setFiltroMese] = useState("");
  const [filtroDipendente, setFiltroDipendente] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const caricaRimborsi = useCallback(async () => {
    setLoading(true);
    setErrore("");
    try {
      const params = new URLSearchParams();
      if (filtroStato) params.set("stato", filtroStato);
      if (filtroCategoria) params.set("categoriaId", filtroCategoria);
      if (filtroMese) params.set("mese", filtroMese);
      if (filtroDipendente && isAdmin()) params.set("dipendenteId", filtroDipendente);

      const res = await api.get(`/rimborsi?${params.toString()}`);
      setRimborsi(res.data);

      if (isAdmin()) {
        const unici = new Map<number, { id: number; nome: string; cognome: string }>();
        for (const r of res.data as Rimborso[]) {
          unici.set(r.dipendente.id, r.dipendente);
        }
        setDipendenti(Array.from(unici.values()));
      }
    } catch {
      setErrore("Errore nel caricamento delle richieste");
    } finally {
      setLoading(false);
    }
  }, [filtroStato, filtroCategoria, filtroMese, filtroDipendente, isAdmin]);

  useEffect(() => {
    if (user) {
      caricaRimborsi();
      api.get("/categorie-spesa").then((res) => setCategorie(res.data));
    }
  }, [user, caricaRimborsi]);

  if (isLoading || !user) {
    return <div className="p-8 text-center text-brutal-muted">Caricamento...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="brutal-title text-2xl">
          {isAdmin() ? "Tutte le richieste" : "Le mie richieste"}
        </h1>
        {isDipendente() && (
          <Link href="/rimborsi/nuova" className="brutal-btn">
            + Nuova richiesta
          </Link>
        )}
      </div>

      {errore && <AlertMessage type="error" message={errore} />}

      <div className="brutal-panel mb-6 p-4">
        <h2 className="brutal-label mb-3">Filtri</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={filtroStato}
            onChange={(e) => setFiltroStato(e.target.value)}
            className="brutal-input text-sm"
          >
            <option value="">Tutti gli stati</option>
            <option value="IN_ATTESA">In attesa</option>
            <option value="APPROVATA">Approvata</option>
            <option value="RIFIUTATA">Rifiutata</option>
            <option value="LIQUIDATA">Liquidata</option>
          </select>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="brutal-input text-sm"
          >
            <option value="">Tutte le categorie</option>
            {categorie.map((c) => (
              <option key={c.id} value={c.id}>
                {c.descrizione}
              </option>
            ))}
          </select>

          <input
            type="month"
            value={filtroMese}
            onChange={(e) => setFiltroMese(e.target.value)}
            className="brutal-input text-sm"
            placeholder="Mese"
          />

          {isAdmin() && (
            <select
              value={filtroDipendente}
              onChange={(e) => setFiltroDipendente(e.target.value)}
              className="brutal-input text-sm"
            >
              <option value="">Tutti i dipendenti</option>
              {dipendenti.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome} {d.cognome}
                </option>
              ))}
            </select>
          )}
        </div>

        <button onClick={caricaRimborsi} className="brutal-btn-ghost mt-3 text-sm">
          Applica filtri
        </button>
      </div>

      {loading ? (
        <p className="text-center text-brutal-muted">Caricamento richieste...</p>
      ) : rimborsi.length === 0 ? (
        <p className="text-center text-brutal-muted">Nessuna richiesta trovata.</p>
      ) : (
        <div className="brutal-table-wrap">
          <table className="brutal-table">
            <thead>
              <tr>
                <th>Data spesa</th>
                <th>Categoria</th>
                <th>Importo</th>
                <th>Descrizione</th>
                {isAdmin() && <th>Dipendente</th>}
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rimborsi.map((r) => (
                <tr key={r.id}>
                  <td>{r.dataSpesa}</td>
                  <td>{r.categoria.descrizione}</td>
                  <td>€ {r.importo.toFixed(2)}</td>
                  <td className="max-w-xs truncate">{r.descrizione}</td>
                  {isAdmin() && (
                    <td>
                      {r.dipendente.nome} {r.dipendente.cognome}
                    </td>
                  )}
                  <td>
                    <span className={statoColori[r.stato]}>{r.statoLabel}</span>
                  </td>
                  <td>
                    <Link href={`/rimborsi/${r.id}`} className="brutal-link">
                      Dettaglio
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
