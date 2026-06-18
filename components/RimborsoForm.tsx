"use client";

import { useState, useEffect, FormEvent } from "react";
import api from "@/lib/axios-client";

type Categoria = { id: number; descrizione: string };

type RimborsoIniziale = {
  dataSpesa: string;
  categoriaId: number;
  importo: number;
  descrizione: string;
  riferimentoGiustificativo?: string | null;
};

type Props = {
  rimborsoIniziale?: RimborsoIniziale;
  rimborsoId?: number;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function RimborsoForm({ rimborsoIniziale, rimborsoId, onSuccess, onCancel }: Props) {
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [dataSpesa, setDataSpesa] = useState(rimborsoIniziale?.dataSpesa ?? "");
  const [categoriaId, setCategoriaId] = useState(rimborsoIniziale?.categoriaId?.toString() ?? "");
  const [importo, setImporto] = useState(rimborsoIniziale?.importo?.toString() ?? "");
  const [descrizione, setDescrizione] = useState(rimborsoIniziale?.descrizione ?? "");
  const [giustificativo, setGiustificativo] = useState(rimborsoIniziale?.riferimentoGiustificativo ?? "");
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCategorie, setLoadingCategorie] = useState(true);

  useEffect(() => {
    api
      .get("/categorie-spesa")
      .then((res) => setCategorie(res.data))
      .catch(() => setErrore("Errore nel caricamento delle categorie"))
      .finally(() => setLoadingCategorie(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrore("");
    setLoading(true);

    const dati = {
      dataSpesa,
      categoriaId: parseInt(categoriaId),
      importo: parseFloat(importo),
      descrizione,
      riferimentoGiustificativo: giustificativo || undefined,
    };

    try {
      if (rimborsoId) {
        await api.put(`/rimborsi/${rimborsoId}`, dati);
      } else {
        await api.post("/rimborsi", dati);
      }
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrore(axiosErr.response?.data?.message || "Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategorie) {
    return <p className="text-brutal-muted">Caricamento categorie...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errore && <div className="brutal-alert brutal-alert-error">{errore}</div>}

      <div>
        <label className="brutal-label">Data spesa *</label>
        <input
          type="date"
          value={dataSpesa}
          onChange={(e) => setDataSpesa(e.target.value)}
          required
          className="brutal-input"
        />
      </div>

      <div>
        <label className="brutal-label">Categoria *</label>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
          className="brutal-input"
        >
          <option value="">Seleziona categoria</option>
          {categorie.map((c) => (
            <option key={c.id} value={c.id}>
              {c.descrizione}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="brutal-label">Importo (€) *</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={importo}
          onChange={(e) => setImporto(e.target.value)}
          required
          className="brutal-input"
        />
      </div>

      <div>
        <label className="brutal-label">Descrizione *</label>
        <textarea
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          required
          rows={3}
          className="brutal-input"
        />
      </div>

      <div>
        <label className="brutal-label">Riferimento giustificativo</label>
        <input
          type="text"
          value={giustificativo}
          onChange={(e) => setGiustificativo(e.target.value)}
          placeholder="Es. numero scontrino o fattura"
          className="brutal-input"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="brutal-btn">
          {loading ? "Salvataggio..." : rimborsoId ? "Salva modifiche" : "Crea richiesta"}
        </button>
        <button type="button" onClick={onCancel} className="brutal-btn-outline">
          Annulla
        </button>
      </div>
    </form>
  );
}
