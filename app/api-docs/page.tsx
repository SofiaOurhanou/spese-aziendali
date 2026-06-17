"use client";

/**
 * Questa pagina su /api-docs incorpora Swagger UI in modo interattivo per esplorare e provare tutte
 * le API REST dell'applicazione, requisito esplicito della traccia con swagger-jsdoc. SwaggerUI viene
 * importato con next/dynamic e ssr: false perché la libreria accede a window e al DOM e non può
 * essere renderizzata lato server senza errori. Punta a url="/api/swagger" che restituisce lo spec
 * OpenAPI generato dai commenti nelle route. L'intestazione spiega che per le route protette bisogna
 * prima fare login, copiare il JWT e usarlo nel pulsante Authorize di Swagger. I CSS ufficiali di
 * swagger-ui-react vengono importati globalmente per questa pagina.
 */

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-brutal-bg">
      <div className="brutal-panel border-b-[3px] border-brutal-border px-6 py-4">
        <h1 className="brutal-title text-xl">Documentazione API</h1>
        <p className="text-sm text-brutal-muted">
          Swagger UI per testare le API. Per le route protette usa il token JWT da login.
        </p>
      </div>
      <SwaggerUI url="/api/swagger" />
    </div>
  );
}
