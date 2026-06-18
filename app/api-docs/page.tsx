"use client";

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
