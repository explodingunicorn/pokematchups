import { TournamentSimulatorFeature } from "@/components/features/tournament-simulator";
import { RequireAuth } from "@/components/auth/require-auth";

export default function SimulatorPage() {
  return (
    <RequireAuth>
      <TournamentSimulatorFeature />
    </RequireAuth>
  );
}
