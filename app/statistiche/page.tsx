"use client";

/**
 * Questa pagina su /statistiche è riservata al responsabile amministrativo e visualizza il riepilogo
 * restituito da GET /api/statistiche/rimborsi, raggruppato per mese e categoria con totali richiesto,
 * approvato e liquidato come richiesto dalla prova. I filtri (mese, categoria, dipendente) costruiscono
 * query string identiche a quelle dell'API; le categorie arrivano da /api/categorie-spesa mentre l'elenco
 * dipendenti è derivato da GET /api/rimborsi per popolare la select senza endpoint utenti dedicato.
 * Sopra la tabella, quattro card mostrano i totali complessivi sommando le righe filtrate. Dipendenti e
 * anonimi vengono reindirizzati; un 403 dal backend sarebbe comunque la rete di sicurezza. AlertMessage
 * gestisce errori di rete o permessi.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios-client";
import { useAuth } from "@/lib/auth-context";
import AlertMessage from "@/components/AlertMessage";

type Statistica = {
  mese: string;
  categoria: string;
  numeroRichieste: number;
  totaleRichiesto: number;
  totaleApprovato: number;
  totaleLiquidato: number;
};

type Categoria = { id: number; descrizione: string };

export default function StatistichePage() {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  const [statistiche, setStatistiche] = useState<Statistica[]>([]);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [dipendenti, setDipendenti] = useState<{ id: number; nome: string; cognome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");

  const [filtroMese, setFiltroMese] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroDipendente, setFiltroDipendente] = useState("");

  // Solo admin può accedere
  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login");
      else if (!isAdmin()) router.push("/dashboard");
    }
  }, [user, isLoading, isAdmin, router]);

  const caricaStatistiche = useCallback(async () => {
    setLoading(true);
    setErrore("");
    try {
      const params = new URLSearchParams();
      if (filtroMese) params.set("mese", filtroMese);
      if (filtroCategoria) params.set("categoriaId", filtroCategoria);
      if (filtroDipendente) params.set("dipendenteId", filtroDipendente);

      const res = await api.get(`/statistiche/rimborsi?${params.toString()}`);
      setStatistiche(res.data);
    } catch {
      setErrore("Errore nel caricamento delle statistiche");
    } finally {
      setLoading(false);
    }
  }, [filtroMese, filtroCategoria, filtroDipendente]);

  useEffect(() => {
    if (user && isAdmin()) {
      caricaStatistiche();
      api.get("/categorie-spesa").then((res) => setCategorie(res.data));
      // Carico i dipendenti dalla lista rimborsi per il filtro
      api.get("/rimborsi").then((res) => {
        const unici = new Map<number, { id: number; nome: string; cognome: string }>();
        for (const r of res.data) {
          unici.set(r.dipendente.id, r.dipendente);
        }
        setDipendenti(Array.from(unici.values()));
      });
    }
  }, [user, isAdmin, caricaStatistiche]);

  if (isLoading || !user) {
    return <div className="p-8 text-center text-brutal-muted">Caricamento...</div>;
  }

  const totali = statistiche.reduce(
    (acc, s) => ({
      numeroRichieste: acc.numeroRichieste + s.numeroRichieste,
      totaleRichiesto: acc.totaleRichiesto + s.totaleRichiesto,
      totaleApprovato: acc.totaleApprovato + s.totaleApprovato,
      totaleLiquidato: acc.totaleLiquidato + s.totaleLiquidato,
    }),
    { numeroRichieste: 0, totaleRichiesto: 0, totaleApprovato: 0, totaleLiquidato: 0 }
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="brutal-title mb-6 text-2xl">Statistiche rimborsi</h1>

      {errore && <AlertMessage type="error" message={errore} />}

      <div className="brutal-panel mb-6 p-4">
        <h2 className="brutal-label mb-3">Filtri</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="month"
            value={filtroMese}
            onChange={(e) => setFiltroMese(e.target.value)}
            className="brutal-input text-sm"
          />
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
        </div>
        <button onClick={caricaStatistiche} className="brutal-btn-ghost mt-3 text-sm">
          Applica filtri
        </button>
      </div>

      {loading ? (
        <p className="text-center text-brutal-muted">Caricamento statistiche...</p>
      ) : statistiche.length === 0 ? (
        <p className="text-center text-brutal-muted">Nessun dato trovato.</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-4">
            <div className="brutal-stat">
              <p className="brutal-title text-2xl">{totali.numeroRichieste}</p>
              <p className="text-sm text-brutal-muted">Richieste</p>
            </div>
            <div className="brutal-stat">
              <p className="brutal-title text-2xl">€ {totali.totaleRichiesto.toFixed(2)}</p>
              <p className="text-sm text-brutal-muted">Totale richiesto</p>
            </div>
            <div className="brutal-stat">
              <p className="brutal-title text-2xl text-brutal-success">€ {totali.totaleApprovato.toFixed(2)}</p>
              <p className="text-sm text-brutal-muted">Totale approvato</p>
            </div>
            <div className="brutal-stat">
              <p className="brutal-title text-2xl text-brutal-accent-dark">€ {totali.totaleLiquidato.toFixed(2)}</p>
              <p className="text-sm text-brutal-muted">Totale liquidato</p>
            </div>
          </div>

          <div className="brutal-table-wrap">
            <table className="brutal-table">
              <thead>
                <tr>
                  <th>Mese</th>
                  <th>Categoria</th>
                  <th>N. richieste</th>
                  <th>Totale richiesto</th>
                  <th>Totale approvato</th>
                  <th>Totale liquidato</th>
                </tr>
              </thead>
              <tbody>
                {statistiche.map((s, i) => (
                  <tr key={i}>
                    <td>{s.mese}</td>
                    <td>{s.categoria}</td>
                    <td>{s.numeroRichieste}</td>
                    <td>€ {s.totaleRichiesto.toFixed(2)}</td>
                    <td>€ {s.totaleApprovato.toFixed(2)}</td>
                    <td>€ {s.totaleLiquidato.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
