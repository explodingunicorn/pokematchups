export interface Player {
  deck: string;
  matchPoints: number;
  id: number;
  opponents: number[];
  skill: number;
  Day2id?: number;
}

export interface MatchupData {
  deck1: string;
  deck2: string;
  wins: number;
  losses: number;
  ties?: number;
  total?: number;
  true_win_rate?: number;
}

export interface TournamentConfig {
  matchupMatrix: number[][];
  metaPercentages: number[];
  matchupNames: string[];
  n_players: number;
  skillPercents: number[];
  isDay2: boolean;
  tuffEnabled?: { [deck: string]: boolean };
  tuffCounts?: { [deck: string]: number };
}

export interface SimulationResults {
  allRecords: Player[];
  endOfRound?: number;
}

export interface BatchResults {
  t16Map: Map<string, number>;
  t32Map: Map<string, number>;
  t64Map: Map<string, number>;
  t128Map: Map<string, number>;
  t256Map: Map<string, number>;
  day2Map: Map<string, number>;
  day1Map: Map<string, number>;
}
