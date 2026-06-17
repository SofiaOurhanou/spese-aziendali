import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Gestione Rimborsi Spese Aziendali",
      version: "1.0.0",
      description:
        "API REST per la gestione delle richieste di rimborso spese aziendali. " +
        "Autenticazione tramite JWT Bearer token ottenuto da login o registrazione.",
    },
    servers: [
      {
        url: "https://spese-aziendali.vercel.app",
        description: "Server di sviluppo",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT ottenuto da POST /api/utenti/login o /api/utenti/register",
        },
      },
      schemas: {
        Utente: {
          type: "object",
          properties: {
            id: { type: "integer" },
            nome: { type: "string" },
            cognome: { type: "string" },
            email: { type: "string" },
            ruolo: { type: "string", enum: ["DIPENDENTE", "RESPONSABILE_AMMINISTRATIVO"] },
          },
        },
        Rimborso: {
          type: "object",
          properties: {
            id: { type: "integer" },
            dataInserimento: { type: "string", format: "date-time" },
            dataSpesa: { type: "string", format: "date" },
            importo: { type: "number" },
            descrizione: { type: "string" },
            riferimentoGiustificativo: { type: "string", nullable: true },
            stato: { type: "string", enum: ["IN_ATTESA", "APPROVATA", "RIFIUTATA", "LIQUIDATA"] },
            statoLabel: { type: "string" },
            categoria: {
              type: "object",
              properties: {
                id: { type: "integer" },
                descrizione: { type: "string" },
              },
            },
            dipendente: { $ref: "#/components/schemas/Utente" },
            dataValutazione: { type: "string", format: "date-time", nullable: true },
            motivazioneRifiuto: { type: "string", nullable: true },
            dataLiquidazione: { type: "string", format: "date-time", nullable: true },
          },
        },
        Statistica: {
          type: "object",
          properties: {
            mese: { type: "string", example: "2026-05" },
            categoria: { type: "string" },
            numeroRichieste: { type: "integer" },
            totaleRichiesto: { type: "number" },
            totaleApprovato: { type: "number" },
            totaleLiquidato: { type: "number" },
          },
        },
        Errore: {
          type: "object",
          properties: {
            message: { type: "string" },
            errors: { type: "object" },
          },
        },
      },
    },
    tags: [
      { name: "Autenticazione", description: "Registrazione e login" },
      { name: "Rimborsi", description: "Gestione richieste di rimborso" },
      { name: "Categorie", description: "Categorie di spesa" },
      { name: "Statistiche", description: "Riepiloghi per admin" },
    ],
  },
  // Legge i commenti @swagger dai file delle API
  apis: ["./app/api/**/*.ts"],
};

export function getSwaggerSpec() {
  return swaggerJSDoc(options);
}
