"use client";

import { type ReactNode } from "react";
import { MatchupProvider } from "@/components/providers/matchup-provider";
import { AuthProvider } from "@/components/providers/auth-provider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <MatchupProvider>{children}</MatchupProvider>
    </AuthProvider>
  );
}
