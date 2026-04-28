import { NextResponse } from "next/server";
import { getExternalDataProvider } from "@/lib/external-data/service";

export async function GET() {
  const provider = getExternalDataProvider();
  const data = await provider.listRecentTournaments();
  return NextResponse.json({ data });
}
