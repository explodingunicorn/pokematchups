export interface ExternalTournamentSummary {
  id: string;
  name: string;
  date: string;
  players: number;
}

export interface ExternalMetaSnapshot {
  sourceTournamentId: string;
  percentages: Record<string, number>;
}

export interface ExternalDataProvider {
  listRecentTournaments(): Promise<ExternalTournamentSummary[]>;
  importMetaFromTournament(tournamentId: string): Promise<ExternalMetaSnapshot>;
}

export class NoopExternalDataProvider implements ExternalDataProvider {
  async listRecentTournaments(): Promise<ExternalTournamentSummary[]> {
    return [];
  }

  async importMetaFromTournament(_tournamentId: string): Promise<ExternalMetaSnapshot> {
    throw new Error("No external data provider configured.");
  }
}

export function getExternalDataProvider(): ExternalDataProvider {
  return new NoopExternalDataProvider();
}
