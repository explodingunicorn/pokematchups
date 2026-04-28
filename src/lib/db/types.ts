export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedScenario {
  id: string;
  user_id: string;
  name: string;
  matchup_data: unknown;
  play_rates: Record<string, number>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SimulationRun {
  id: string;
  user_id: string;
  scenario_id: string | null;
  config: Record<string, unknown>;
  results: Record<string, unknown>;
  created_at: string;
}
