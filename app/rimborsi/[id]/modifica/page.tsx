"use client";

/**
 * Questa pagina su /rimborsi/[id]/modifica permette al dipendente proprietario di aggiornare una
 * richiesta ancora IN_ATTESA, come imposto dalla traccia che vieta modifiche dopo la valutazione
 * dell'admin. Al mount verifica autenticazione e ruolo DIPENDENTE, poi carica il rimborso con GET
 * e controlla lato client che stato sia IN_ATTESA e dipendente.id coincida con l'utente loggato;
 * altrimenti mostra errore senza form. Se tutto ok, passa i dati iniziali a RimborsoForm con
 * rimborsoId impostato: al submit viene eseguito PUT /api/rimborsi/:id. onSuccess torna al dettaglio
 * della stessa richiesta. Questa doppia verifica client+server evita di mostrare un form inutile
 * quando l'admin ha già approvato nel frattempo, pur restando il backend l'autorità finale.
 */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios-client";
import { useAuth } from "@/lib/auth-context";
import RimborsoForm from "@/components/RimborsoForm";

export default function ModificaRimborsoPage() {
  const { user, isLoading, isDipendente } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [rimborso, setRimborso] = useState<{
    dataSpesa: string;
    categoria: { id: number };
    importo: number;
    descrizione: string;
    riferimentoGiustificativo?: string | null;
    stato: string;
    dipendente: { id: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login");
      else if (!isDipendente()) router.push("/dashboard");
    }
  }, [user, isLoading, isDipendente, router]);

  useEffect(() => {
    if (user && id) {
      api
        .get(`/rimborsi/${id}`)
        .then((res) => {
          const r = res.data;
          if (r.stato !== "IN_ATTESA" || r.dipendente.id !== user.id) {
            setErrore("Questa richiesta non può essere modificata");
          } else {
            setRimborso(r);
          }
        })
        .catch(() => setErrore("Richiesta non trovata"))
        .finally(() => setLoading(false));
    }
  }, [user, id]);

  if (isLoading || loading) {
    return <div className="p-8 text-center text-brutal-muted">Caricamento...</div>;
  }

  if (errore || !rimborso) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="mb-4 text-brutal-error">{errore || "Errore"}</p>
        <Link href="/rimborsi" className="brutal-link">
          ← Torna alla lista
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href={`/rimborsi/${id}`} className="brutal-link mb-4 inline-block text-sm">
        ← Torna al dettaglio
      </Link>
      <h1 className="brutal-title mb-6 text-2xl">Modifica richiesta #{id}</h1>
      <div className="brutal-card p-6">
        <RimborsoForm
          rimborsoId={parseInt(id)}
          rimborsoIniziale={{
            dataSpesa: rimborso.dataSpesa,
            categoriaId: rimborso.categoria.id,
            importo: rimborso.importo,
            descrizione: rimborso.descrizione,
            riferimentoGiustificativo: rimborso.riferimentoGiustificativo,
          }}
          onSuccess={() => router.push(`/rimborsi/${id}`)}
          onCancel={() => router.push(`/rimborsi/${id}`)}
        />
      </div>
    </div>
  );
}
