import { getSwaggerSpec } from "@/lib/swagger";
import { NextResponse } from "next/server";

export async function GET() {
  const spec = getSwaggerSpec();
  return NextResponse.json(spec);
}
