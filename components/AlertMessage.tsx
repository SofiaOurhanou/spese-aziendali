"use client";

/**
 * Questo componente è un banner di feedback riusabile per errori, successi e messaggi informativi
 * nelle pagine che eseguono operazioni asincrone (login, liste, dettaglio rimborsi, statistiche).
 * Accetta type per scegliere le classi CSS brutal-alert-* coerenti con il design system dell'app,
 * message come testo da mostrare, e opzionalmente onClose per una X che permette di dismissare
 * l'avviso dopo che l'utente l'ha letto. Centralizzarlo evita di ripetere markup e classi in ogni
 * form e tiene uniforme la presentazione degli errori API (spesso message dal JSON di api-response)
 * rispetto ai messaggi di successo dopo approvazione o salvataggio rimborso.
 */

type Props = {
  type: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
};

export default function AlertMessage({ type, message, onClose }: Props) {
  const colors = {
    error: "brutal-alert brutal-alert-error",
    success: "brutal-alert brutal-alert-success",
    info: "brutal-alert brutal-alert-info",
  };

  return (
    <div className={colors[type]}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="ml-4 text-sm opacity-70 hover:opacity-100">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
