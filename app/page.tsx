"use client";

/**
 * Questa è la landing page pubblica su /: presenta il titolo dell'applicazione e i link ad accesso,
 * registrazione e documentazione API Swagger. Se l'utente è già autenticato (token in localStorage
 * ripristinato da AuthContext), un useEffect lo reindirizza automaticamente a /dashboard per evitare
 * che un dipendente o admin loggato veda ancora la home da visitatore. È Client Component perché usa
 * useAuth, useRouter e useEffect per quella logica lato browser. La Navbar è nascosta su questa pagina
 * (vedi Navbar.tsx) per un aspetto più pulito alla prima visita; il link a /api-docs resta accessibile
 * anche senza login per chi vuole esplorare le API prima di registrarsi.
 */

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="brutal-card w-full max-w-lg p-8 text-center">
        <h1 className="brutal-title mb-2 text-3xl">Rimborsi Spese Aziendali</h1>
        <p className="mb-8 text-brutal-muted">
          Sistema per gestire le richieste di rimborso spese presentate dai dipendenti.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/login" className="brutal-btn">
            Accedi
          </Link>
          <Link href="/register" className="brutal-btn-outline">
            Registrati
          </Link>
        </div>

        <p className="mt-6 text-sm text-brutal-muted">
          <Link href="/api-docs" className="brutal-link">
            Documentazione API (Swagger)
          </Link>
        </p>
      </div>
    </div>
  );
}
