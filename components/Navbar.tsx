"use client";

/**
 * Questo componente renderizza la barra di navigazione superiore presente su tutte le pagine tranne
 * la home, login e register quando l'utente non è autenticato (in quel caso return null per non
 * duplicare i link già in landing e form auth). Per utenti loggati mostra link a Dashboard, Rimborsi
 * (etichetta diversa per admin vs dipendente), Statistiche solo per admin, e API Docs; evidenzia la
 * voce attiva confrontando pathname con usePathname. A destra mostra nome utente, ruolo abbreviato
 * e pulsante Logout che pulisce AuthContext e forza reload verso /login. La logica isAdmin/isDipendente
 * dal context tiene il menu allineato alle stesse regole di visibilità della dashboard.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { user, logout, isAdmin, isLoading } = useAuth();
  const pathname = usePathname();

  const paginePubbliche = ["/", "/login", "/register"];
  if (!isLoading && !user && paginePubbliche.includes(pathname)) {
    return null;
  }

  const linkClass = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")
      ? "brutal-nav-link brutal-nav-link-active"
      : "brutal-nav-link";

  return (
    <nav className="brutal-nav">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={user ? "/dashboard" : "/"}
            className="brutal-title text-lg text-brutal-accent-dark hover:text-brutal-accent"
          >
            Rimborsi Aziendali
          </Link>

          {user && (
            <div className="ml-6 flex gap-1">
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </Link>
              <Link href="/rimborsi" className={linkClass("/rimborsi")}>
                {isAdmin() ? "Tutte le richieste" : "Le mie richieste"}
              </Link>
              {isAdmin() && (
                <Link href="/statistiche" className={linkClass("/statistiche")}>
                  Statistiche
                </Link>
              )}
              <Link href="/api-docs" className={linkClass("/api-docs")}>
                API Docs
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-sm text-brutal-muted">Caricamento...</span>
          ) : user ? (
            <>
              <span className="text-sm text-brutal-muted">
                {user.nome} {user.cognome}
                <span className="ml-1 text-xs opacity-60">
                  ({isAdmin() ? "Admin" : "Dipendente"})
                </span>
              </span>
              <button
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
                className="brutal-btn-ghost text-brutal-error"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="brutal-link text-sm">
                Login
              </Link>
              <Link href="/register" className="brutal-link text-sm">
                Registrati
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
