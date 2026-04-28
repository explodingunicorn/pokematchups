import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, SavedScenario, SimulationRun } from "@/lib/db/types";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
}

export async function listSavedScenarios(): Promise<SavedScenario[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("saved_scenarios")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as SavedScenario[]) ?? [];
}

export async function listSimulationRuns(): Promise<SimulationRun[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("simulation_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as SimulationRun[]) ?? [];
}
