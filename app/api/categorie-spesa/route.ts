import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { ok, unauthorized, serverError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized();

    const categorie = await prisma.categoriaSpesa.findMany({
      orderBy: { descrizione: "asc" },
    });

    return ok(categorie);
  } catch (error) {
    console.error("Errore categorie:", error);
    return serverError();
  }
}
