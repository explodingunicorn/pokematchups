import { NextResponse } from "next/server";
import { getExternalDataProvider } from "@/lib/external-data/service";

interface ImportBody {
  tournamentId?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ImportBody;
  if (!body.tournamentId) {
    return NextResponse.json(
      { error: { code: "missing_tournament_id", message: "tournamentId is required." } },
      { status: 400 }
    );
  }

  try {
    const provider = getExternalDataProvider();
    const data = await provider.importMetaFromTournament(body.tournamentId);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "provider_not_configured",
          message: error instanceof Error ? error.message : "Unknown provider error.",
        },
      },
      { status: 501 }
    );
  }
}
