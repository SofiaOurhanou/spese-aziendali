"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AlertMessage from "@/components/AlertMessage";

export default function RegisterPage() {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confermaPassword, setConfermaPassword] = useState("");
  const [ruolo, setRuolo] = useState<"DIPENDENTE" | "RESPONSABILE_AMMINISTRATIVO">("DIPENDENTE");
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.push("/dashboard");
  }, [user, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrore("");

    if (password !== confermaPassword) {
      setErrore("Le password non coincidono");
      return;
    }

    setLoading(true);
    try {
      await register({ nome, cognome, email, password, confermaPassword, ruolo });
      router.push("/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrore(axiosErr.response?.data?.message || "Errore durante la registrazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="brutal-card w-full max-w-md p-8">
        <h1 className="brutal-title mb-6 text-2xl">Registrati</h1>

        {errore && <AlertMessage type="error" message={errore} onClose={() => setErrore("")} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="brutal-label">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="brutal-input"
              />
            </div>
            <div>
              <label className="brutal-label">Cognome *</label>
              <input
                type="text"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                required
                className="brutal-input"
              />
            </div>
          </div>

          <div>
            <label className="brutal-label">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="brutal-input"
            />
          </div>

          <div>
            <label className="brutal-label">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="brutal-input"
            />
          </div>

          <div>
            <label className="brutal-label">Conferma password *</label>
            <input
              type="password"
              value={confermaPassword}
              onChange={(e) => setConfermaPassword(e.target.value)}
              required
              className="brutal-input"
            />
          </div>

          <div>
            <label className="brutal-label">Ruolo *</label>
            <select
              value={ruolo}
              onChange={(e) => setRuolo(e.target.value as typeof ruolo)}
              className="brutal-input"
            >
              <option value="DIPENDENTE">Dipendente</option>
              <option value="RESPONSABILE_AMMINISTRATIVO">Responsabile amministrativo</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="brutal-btn w-full">
            {loading ? "Registrazione..." : "Registrati"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-brutal-muted">
          Hai già un account?{" "}
          <Link href="/login" className="brutal-link">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
