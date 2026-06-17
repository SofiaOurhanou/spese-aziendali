# Gestione Rimborsi Spese Aziendali

Applicazione web full-stack per la gestione delle richieste di rimborso spese presentate dai dipendenti.

## Stack tecnologico

- **Frontend:** Next.js 16 (CSR con `"use client"`), React 19, Tailwind CSS 4, Axios
- **Backend:** Next.js API Routes, JWT, Zod
- **Database:** PostgreSQL (Supabase) con Prisma 7
- **Documentazione API:** Swagger UI (`swagger-jsdoc`)
- **Test:** Vitest

## Funzionalità

### Dipendente
- Registrazione e login
- Creazione richieste di rimborso
- Visualizzazione, modifica ed eliminazione delle proprie richieste (solo se IN_ATTESA)
- Filtri per stato, categoria e mese

### Responsabile amministrativo
- Visualizzazione di tutte le richieste
- Approvazione, rifiuto e liquidazione
- Statistiche aggregate per mese e categoria
- Filtri per stato, categoria, dipendente e mese

## Setup

### Prerequisiti
- Node.js 20+
- Database PostgreSQL (configurato in `.env`)

### Installazione

```bash
# Installa dipendenze
npm install

# Genera il client Prisma
npm run db:generate

# Applica le migration al database
npm run db:migrate

# Popola il database con dati di test
npm run db:seed

# Avvia il server di sviluppo
npm run dev
```

L'applicazione sarà disponibile su [http://localhost:3000](http://localhost:3000).

## Utenti di test

Password per tutti: `Password123!`

| Email | Ruolo |
|-------|-------|
| `mario.rossi@azienda.it` | Dipendente |
| `laura.bianchi@azienda.it` | Dipendente |
| `admin.verdi@azienda.it` | Responsabile amministrativo |

## Documentazione API (Swagger)

- **Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI JSON:** [http://localhost:3000/api/swagger](http://localhost:3000/api/swagger)

Per testare le API protette:
1. Esegui `POST /api/utenti/login` con le credenziali di test
2. Copia il token JWT dalla risposta
3. Clicca "Authorize" in Swagger UI e inserisci: `Bearer <token>`

### Endpoint principali

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/utenti/register` | Registrazione |
| POST | `/api/utenti/login` | Login |
| GET | `/api/rimborsi` | Lista rimborsi (con filtri) |
| POST | `/api/rimborsi` | Crea rimborso |
| GET | `/api/rimborsi/{id}` | Dettaglio |
| PUT | `/api/rimborsi/{id}` | Modifica |
| DELETE | `/api/rimborsi/{id}` | Elimina |
| PUT | `/api/rimborsi/{id}/approva` | Approva |
| PUT | `/api/rimborsi/{id}/rifiuta` | Rifiuta |
| PUT | `/api/rimborsi/{id}/liquida` | Liquida |
| GET | `/api/categorie-spesa` | Categorie |
| GET | `/api/statistiche/rimborsi` | Statistiche (solo admin) |

## Test

```bash
# Esegui tutti i test
npm test

# Test in modalità watch
npm run test:watch
```

I test coprono:
- Validazioni di registrazione e login
- Regole di autorizzazione per ruolo
- CRUD rimborsi con controlli di accesso
- Statistiche riservate agli admin

## Script disponibili

| Script | Descrizione |
|--------|-------------|
| `npm run dev` | Server di sviluppo |
| `npm run build` | Build produzione |
| `npm run db:generate` | Genera client Prisma |
| `npm run db:migrate` | Esegue migration |
| `npm run db:seed` | Popola dati di test |
| `npm test` | Esegue i test |

## Variabili d'ambiente

File `.env`:

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=chiave-segreta-dev-cambiami-in-produzione
```
