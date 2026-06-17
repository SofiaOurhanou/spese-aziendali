"use client";

/**
 * Questo componente è il wrapper client del layout globale: Next.js non permette di usare Context
 * React direttamente in layout.tsx server, quindi Providers viene importato lì e qui monta
 * AuthProvider (stato login) e Navbar (navigazione condizionale per ruolo). Avvolge children in
 * un tag main con flex-1 così il contenuto delle pagine occupa lo spazio verticale rimanente sotto
 * la barra di navigazione, mantenendo footer/navbar fissi nel flusso visivo. Ogni pagina dell'app
 * eredita automaticamente autenticazione e menu senza doverli importare singolarmente, riducendo
 * duplicazione e garantendo comportamento coerente su dashboard, rimborsi, statistiche e auth.
 */

import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
    </AuthProvider>
  );
}
