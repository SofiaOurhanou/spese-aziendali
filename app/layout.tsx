/**
 * Questo è il layout radice dell'applicazione Next.js App Router: avvolge ogni pagina con la
 * struttura HTML di base, i font Google (Space Mono per il testo, Syne per i titoli) e gli stili
 * globali. Resta un Server Component perché carica font e metadata lato server senza inviare
 * JavaScript extra al client per queste operazioni. I metadata impostano titolo e descrizione per
 * SEO e tab del browser. Il vero contenuto dell'app passa da Providers, che è Client Component e
 * monta AuthProvider e Navbar: questa separazione rispetta il vincolo che i context React richiedono
 * "use client" mentre layout.tsx può restare server-side. Le classi Tailwind su html/body definiscono
 * sfondo, testo e layout flex column che fa espandere main tra navbar e fondo pagina.
 */

import type { Metadata } from "next";
import { Space_Mono, Syne } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Gestione Rimborsi Spese Aziendali",
  description: "Sistema per la gestione delle richieste di rimborso spese aziendali",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${spaceMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brutal-bg text-brutal-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
