"use client";

/**
 * Questo file implementa lo stato globale dell'autenticazione nel frontend tramite React Context,
 * perché molte pagine e componenti (Navbar, dashboard, liste rimborsi) devono sapere chi è loggato
 * senza passare props a ogni livello dell'albero. Al primo caricamento legge token e dati utente
 * dal localStorage per ripristinare la sessione dopo un refresh; login e register chiamano le API,
 * ricevono token + profilo e li persistono con `salvaSessione`. Il logout pulisce tutto. Espone
 * anche `isAdmin` e `isDipendente` per mostrare o nascondere funzionalità in base al ruolo, come
 * richiesto dalla specifica (solo dipendenti creano rimborsi, solo admin approva e vede statistiche).
 * È un Client Component perché usa hook React e localStorage, quindi viene wrappato da Providers nel
 * layout anziché messo direttamente in layout.tsx che in App Router resta un Server Component.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "./axios-client";

export type User = {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  ruolo: "DIPENDENTE" | "RESPONSABILE_AMMINISTRATIVO";
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isDipendente: () => boolean;
};

type RegisterData = {
  nome: string;
  cognome: string;
  email: string;
  password: string;
  confermaPassword: string;
  ruolo: "DIPENDENTE" | "RESPONSABILE_AMMINISTRATIVO";
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al caricamento dell'app, controllo se c'è un utente salvato nel localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const salvaSessione = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post("/utenti/login", { email, password });
    salvaSessione(res.data.token, res.data.user);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post("/utenti/register", data);
    salvaSessione(res.data.token, res.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = () => user?.ruolo === "RESPONSABILE_AMMINISTRATIVO";
  const isDipendente = () => user?.ruolo === "DIPENDENTE";

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, isAdmin, isDipendente }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth va usato dentro AuthProvider");
  return ctx;
}
