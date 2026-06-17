"use client";

/**
 * Questa pagina implementa il form di login su /login: raccoglie email e password, invoca login()
 * dall'AuthContext che a sua volta chiama POST /api/utenti/login via axios-client, e in caso di
 * successo reindirizza a /dashboard. Gli errori dell'API (401 credenziali errate, 400 validazione)
 * vengono mostrati con AlertMessage estraendo message dalla risposta Axios. Se l'utente è già loggato
 * viene mandato alla dashboard senza mostrare il form. La validazione HTML (required, type=email) è
 * solo UX; la sicurezza reale è sul server con loginSchema. Il link a /register completa il flusso
 * onboarding per nuovi utenti della prova d'esame.
 */

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AlertMessage from "@/components/AlertMessage";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.push("/dashboard");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrore("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrore(axiosErr.response?.data?.message || "Credenziali non corrette");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="brutal-card w-full max-w-md p-8">
        <h1 className="brutal-title mb-6 text-2xl">Accedi</h1>

        {errore && <AlertMessage type="error" message={errore} onClose={() => setErrore("")} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="brutal-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="brutal-input"
              placeholder="nome@azienda.it"
            />
          </div>
          <div>
            <label className="brutal-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="brutal-input"
            />
          </div>
          <button type="submit" disabled={loading} className="brutal-btn w-full">
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-brutal-muted">
          Non hai un account?{" "}
          <Link href="/register" className="brutal-link">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
