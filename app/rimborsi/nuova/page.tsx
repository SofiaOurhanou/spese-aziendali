"use client";

/**
 * Questa pagina su /rimborsi/nuova ospita il form di creazione di una nuova richiesta di rimborso,
 * accessibile solo ai dipendenti: se un admin o un anonimo ci arriva viene reindirizzato rispettivamente
 * a dashboard o login, allineandosi al vincolo backend che POST /api/rimborsi accetta solo ruolo
 * DIPENDENTE. Delega l'intero form al componente riusabile RimborsoForm senza rimborsoId, che al
 * submit chiama POST /api/rimborsi; onSuccess e onCancel tornano alla lista /rimborsi. Il layout è
 * volutamente minimale (titolo + card) perché tutta la logica di campi, validazione client e caricamento
 * categorie vive in RimborsoForm, condiviso anche con la pagina di modifica per non duplicare UI.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RimborsoForm from "@/components/RimborsoForm";

export default function NuovaRimborsoPage() {
  const { user, isLoading, isDipendente } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login");
      else if (!isDipendente()) router.push("/dashboard");
    }
  }, [user, isLoading, isDipendente, router]);

  if (isLoading || !user) {
    return <div className="p-8 text-center text-brutal-muted">Caricamento...</div>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="brutal-title mb-6 text-2xl">Nuova richiesta di rimborso</h1>
      <div className="brutal-card p-6">
        <RimborsoForm
          onSuccess={() => router.push("/rimborsi")}
          onCancel={() => router.push("/rimborsi")}
        />
      </div>
    </div>
  );
}
