"use client";

/**
 * Questo file definisce l'unica istanza Axios usata dal frontend per parlare con le API sotto /api,
 * così baseURL, header JSON e gestione del token JWT non vanno ripetuti in ogni pagina. L'interceptor
 * di richiesta allega automaticamente `Authorization: Bearer <token>` se presente in localStorage,
 * perché quasi tutte le route di dominio richiedono autenticazione. L'interceptor di risposta
 * intercetta i 401 (token assente, scaduto o non valido): in quel caso cancella la sessione locale
 * e reindirizza al login, evitando che l'utente resti su pagine protette con credenziali morte.
 * Il controllo sul pathname evita loop su /, /login e /register dove un 401 è comportamento atteso.
 * Centralizzare qui la logica HTTP separa le pagine React dalla preoccupazione di come autenticarsi.
 */

import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Prima di ogni richiesta, aggiungo il token JWT se c'è nel localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Se il server risponde 401, probabilmente il token è scaduto -> torno al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      // Non redirectare se siamo già su login o register
      if (!path.includes("/login") && !path.includes("/register") && path !== "/") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
