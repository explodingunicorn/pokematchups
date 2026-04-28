export interface MatchupRow {
  deck1: string;
  deck2: string;
  wins: string | number;
  losses: string | number;
  ties?: string | number;
  total?: string | number;
  true_win_rate?: number;
}
