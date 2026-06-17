"use client";

/**
 * Questa pagina su /rimborsi/[id] mostra il dettaglio completo di una singola richiesta caricata con
 * GET /api/rimborsi/:id, inclusi dati di valutazione, motivazione rifiuto e liquidazione quando presenti.
 * Il dipendente proprietario di una richiesta IN_ATTESA vede pulsanti Modifica ed Elimina che chiamano
 * rispettivamente navigazione a /modifica e DELETE /api/rimborsi/:id; l'admin su IN_ATTESA può Approvare
 * o Rifiutare (con textarea opzionale per motivazione) tramite PUT sulle route dedicate, e su APPROVATA
 * può Registrare liquidazione. Ogni azione ricarica il dettaglio o reindirizza alla lista dopo delete.
 * I controlli UI su stato e ruolo rispecchiano rimborso-rules; il backend ripete gli stessi controlli
 * per sicurezza. AlertMessage comunica successi ed errori delle operazioni asincrone.
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios-client";
import { useAuth } from "@/lib/auth-context";
import AlertMessage from "@/components/AlertMessage";

type RimborsoDettaglio = {
  id: number;
  dataInserimento: string;
  dataSpesa: string;
  importo: number;
  descrizione: string;
  riferimentoGiustificativo: string | null;
  stato: string;
  statoLabel: string;
  categoria: { id: number; descrizione: string };
  dipendente: { id: number; nome: string; cognome: string; email: string };
  dataValutazione: string | null;
  responsabileValutazione: { id: number; nome: string; cognome: string } | null;
  motivazioneRifiuto: string | null;
  dataLiquidazione: string | null;
};

const statoColori: Record<string, string> = {
  IN_ATTESA: "brutal-badge brutal-badge-warning",
  APPROVATA: "brutal-badge brutal-badge-success",
  RIFIUTATA: "brutal-badge brutal-badge-error",
  LIQUIDATA: "brutal-badge brutal-badge-info",
};

export default function RimborsoDettaglioPage() {
  const { user, isLoading, isAdmin, isDipendente } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [rimborso, setRimborso] = useState<RimborsoDettaglio | null>(null);
  const [loading, setLoading] = useState(true);
  const [azioneLoading, setAzioneLoading] = useState(false);
  const [messaggio, setMessaggio] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [motivazioneRifiuto, setMotivazioneRifiuto] = useState("");
  const [mostraRifiuto, setMostraRifiuto] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const caricaDettaglio = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/rimborsi/${id}`);
      setRimborso(res.data);
    } catch {
      setMessaggio({ type: "error", text: "Richiesta non trovata o accesso negato" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) caricaDettaglio();
  }, [user, id]);

  const eseguiAzione = async (azione: "approva" | "rifiuta" | "liquida") => {
    setAzioneLoading(true);
    setMessaggio(null);
    try {
      const body = azione === "rifiuta" ? { motivazione: motivazioneRifiuto } : undefined;
      await api.put(`/rimborsi/${id}/${azione}`, body);
      setMessaggio({ type: "success", text: `Richiesta ${azione === "approva" ? "approvata" : azione === "rifiuta" ? "rifiutata" : "liquidata"} con successo` });
      setMostraRifiuto(false);
      caricaDettaglio();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessaggio({ type: "error", text: axiosErr.response?.data?.message || "Operazione non riuscita" });
    } finally {
      setAzioneLoading(false);
    }
  };

  const eliminaRichiesta = async () => {
    if (!confirm("Sei sicuro di voler eliminare questa richiesta?")) return;
    setAzioneLoading(true);
    try {
      await api.delete(`/rimborsi/${id}`);
      router.push("/rimborsi");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setMessaggio({ type: "error", text: axiosErr.response?.data?.message || "Eliminazione non riuscita" });
      setAzioneLoading(false);
    }
  };

  if (isLoading || loading) {
    return <div className="p-8 text-center text-brutal-muted">Caricamento...</div>;
  }

  if (!rimborso) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        {messaggio && <AlertMessage type="error" message={messaggio.text} />}
        <Link href="/rimborsi" className="brutal-link">
          ← Torna alla lista
        </Link>
      </div>
    );
  }

  const puoModificare = isDipendente() && rimborso.stato === "IN_ATTESA" && rimborso.dipendente.id === user?.id;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/rimborsi" className="brutal-link mb-4 inline-block text-sm">
        ← Torna alla lista
      </Link>

      <h1 className="brutal-title mb-4 text-2xl">Dettaglio richiesta #{rimborso.id}</h1>

      {messaggio && (
        <AlertMessage type={messaggio.type} message={messaggio.text} onClose={() => setMessaggio(null)} />
      )}

      <div className="brutal-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className={`${statoColori[rimborso.stato]} text-sm`}>{rimborso.statoLabel}</span>
          <span className="brutal-title text-2xl">€ {rimborso.importo.toFixed(2)}</span>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between border-b-2 border-brutal-border pb-2">
            <dt className="text-brutal-muted">Data spesa</dt>
            <dd className="font-bold">{rimborso.dataSpesa}</dd>
          </div>
          <div className="flex justify-between border-b-2 border-brutal-border pb-2">
            <dt className="text-brutal-muted">Data inserimento</dt>
            <dd className="font-bold">{new Date(rimborso.dataInserimento).toLocaleDateString("it-IT")}</dd>
          </div>
          <div className="flex justify-between border-b-2 border-brutal-border pb-2">
            <dt className="text-brutal-muted">Categoria</dt>
            <dd className="font-bold">{rimborso.categoria.descrizione}</dd>
          </div>
          <div className="flex justify-between border-b-2 border-brutal-border pb-2">
            <dt className="text-brutal-muted">Dipendente</dt>
            <dd className="font-bold">
              {rimborso.dipendente.nome} {rimborso.dipendente.cognome}
            </dd>
          </div>
          <div className="border-b-2 border-brutal-border pb-2">
            <dt className="mb-1 text-brutal-muted">Descrizione</dt>
            <dd className="font-bold">{rimborso.descrizione}</dd>
          </div>
          {rimborso.riferimentoGiustificativo && (
            <div className="flex justify-between border-b-2 border-brutal-border pb-2">
              <dt className="text-brutal-muted">Giustificativo</dt>
              <dd className="font-bold">{rimborso.riferimentoGiustificativo}</dd>
            </div>
          )}
          {rimborso.dataValutazione && (
            <div className="flex justify-between border-b-2 border-brutal-border pb-2">
              <dt className="text-brutal-muted">Data valutazione</dt>
              <dd className="font-bold">
                {new Date(rimborso.dataValutazione).toLocaleDateString("it-IT")}
                {rimborso.responsabileValutazione &&
                  ` (${rimborso.responsabileValutazione.nome} ${rimborso.responsabileValutazione.cognome})`}
              </dd>
            </div>
          )}
          {rimborso.motivazioneRifiuto && (
            <div className="border-b-2 border-brutal-border pb-2">
              <dt className="mb-1 text-brutal-muted">Motivazione rifiuto</dt>
              <dd className="font-bold text-brutal-error">{rimborso.motivazioneRifiuto}</dd>
            </div>
          )}
          {rimborso.dataLiquidazione && (
            <div className="flex justify-between">
              <dt className="text-brutal-muted">Data liquidazione</dt>
              <dd className="font-bold">
                {new Date(rimborso.dataLiquidazione).toLocaleDateString("it-IT")}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {puoModificare && (
        <div className="mt-4 flex gap-3">
          <Link href={`/rimborsi/${id}/modifica`} className="brutal-btn">
            Modifica
          </Link>
          <button
            onClick={eliminaRichiesta}
            disabled={azioneLoading}
            className="brutal-btn brutal-btn-danger"
          >
            Elimina
          </button>
        </div>
      )}

      {isAdmin() && rimborso.stato === "IN_ATTESA" && (
        <div className="mt-4 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => eseguiAzione("approva")}
              disabled={azioneLoading}
              className="brutal-btn brutal-btn-success"
            >
              {azioneLoading ? "..." : "Approva"}
            </button>
            <button
              onClick={() => setMostraRifiuto(!mostraRifiuto)}
              className="brutal-btn brutal-btn-danger"
            >
              Rifiuta
            </button>
          </div>
          {mostraRifiuto && (
            <div className="brutal-panel border-brutal-error p-4">
              <label className="brutal-label">Motivazione rifiuto (opzionale)</label>
              <textarea
                value={motivazioneRifiuto}
                onChange={(e) => setMotivazioneRifiuto(e.target.value)}
                rows={2}
                className="brutal-input mb-2"
              />
              <button
                onClick={() => eseguiAzione("rifiuta")}
                disabled={azioneLoading}
                className="brutal-btn brutal-btn-danger"
              >
                Conferma rifiuto
              </button>
            </div>
          )}
        </div>
      )}

      {isAdmin() && rimborso.stato === "APPROVATA" && (
        <div className="mt-4">
          <button
            onClick={() => eseguiAzione("liquida")}
            disabled={azioneLoading}
            className="brutal-btn"
          >
            {azioneLoading ? "..." : "Registra liquidazione"}
          </button>
        </div>
      )}
    </div>
  );
}
