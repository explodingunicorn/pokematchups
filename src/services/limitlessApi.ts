const BASE_URL = "https://play.limitlesstcg.com/api";

export interface LimitlessTournament {
  id: string;
  game: string;
  format: string;
  name: string;
  date: string;
  players: number;
}

export interface LimitlessDeck {
  id: string;
  name: string;
  icons?: string[];
}

export interface LimitlessStanding {
  player: string;
  name: string;
  country?: string;
  placing: number;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  deck?: LimitlessDeck;
  drop?: number | null;
}

export interface MetaPercentages {
  [deckName: string]: number;
}

/**
 * Fetch recent tournaments from Limitless API
 */
export async function fetchTournaments(
  apiKey: string,
  game: string = "PTCG",
  format?: string,
  limit: number = 20
): Promise<LimitlessTournament[]> {
  const params = new URLSearchParams({
    key: apiKey,
    game,
    limit: limit.toString(),
  });

  if (format) {
    params.append("format", format);
  }

  const response = await fetch(`${BASE_URL}/tournaments?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch tournament standings (includes deck data)
 */
export async function fetchTournamentStandings(
  apiKey: string,
  tournamentId: string
): Promise<LimitlessStanding[]> {
  const response = await fetch(
    `${BASE_URL}/tournaments/${tournamentId}/standings?key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch standings: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate meta percentages from tournament standings
 */
export function calculateMetaPercentages(
  standings: LimitlessStanding[]
): MetaPercentages {
  const deckCounts: { [deckName: string]: number } = {};
  let totalPlayers = 0;

  // Count each deck archetype
  standings.forEach((standing) => {
    if (standing.deck && standing.deck.name) {
      const deckName = standing.deck.name;
      deckCounts[deckName] = (deckCounts[deckName] || 0) + 1;
      totalPlayers++;
    }
  });

  // Calculate percentages
  const metaPercentages: MetaPercentages = {};
  Object.entries(deckCounts).forEach(([deckName, count]) => {
    metaPercentages[deckName] = (count / totalPlayers) * 100;
  });

  return metaPercentages;
}

/**
 * Get and calculate meta percentages for a tournament
 */
export async function getMetaFromTournament(
  apiKey: string,
  tournamentId: string
): Promise<MetaPercentages> {
  const standings = await fetchTournamentStandings(apiKey, tournamentId);
  return calculateMetaPercentages(standings);
}

/**
 * Validate API key by making a test request
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${BASE_URL}/tournaments?key=${apiKey}&limit=1`
    );
    return response.ok;
  } catch {
    return false;
  }
}

