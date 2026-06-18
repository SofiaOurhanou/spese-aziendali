"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user, isLoading, isAdmin, isDipendente } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-brutal-muted">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="brutal-title mb-2 text-2xl">Benvenuto, {user.nome}!</h1>
      <p className="mb-8 text-brutal-muted">
        Sei loggato come{" "}
        <strong className="text-brutal-text">
          {isAdmin() ? "Responsabile amministrativo" : "Dipendente"}
        </strong>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/rimborsi" className="brutal-card-hover p-6">
          <h2 className="brutal-subtitle mb-2 text-lg">
            {isAdmin() ? "Tutte le richieste" : "Le mie richieste"}
          </h2>
          <p className="text-sm text-brutal-muted">
            {isAdmin()
              ? "Visualizza, approva, rifiuta e liquida le richieste di rimborso."
              : "Visualizza, crea e gestisci le tue richieste di rimborso."}
          </p>
        </Link>

        {isDipendente() && (
          <Link href="/rimborsi/nuova" className="brutal-card-hover p-6">
            <h2 className="brutal-subtitle mb-2 text-lg">Nuova richiesta</h2>
            <p className="text-sm text-brutal-muted">
              Inserisci una nuova richiesta di rimborso per una spesa sostenuta.
            </p>
          </Link>
        )}

        {isAdmin() && (
          <Link href="/statistiche" className="brutal-card-hover p-6">
            <h2 className="brutal-subtitle mb-2 text-lg">Statistiche</h2>
            <p className="text-sm text-brutal-muted">
              Consulta il riepilogo delle richieste per mese e categoria.
            </p>
          </Link>
        )}

        <Link href="/api-docs" className="brutal-card-hover p-6">
          <h2 className="brutal-subtitle mb-2 text-lg">Documentazione API</h2>
          <p className="text-sm text-brutal-muted">Swagger UI per testare le API REST.</p>
        </Link>
      </div>
    </div>
  );
}
