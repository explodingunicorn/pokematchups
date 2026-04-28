"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MatchupRow } from "@/types/matchup";

interface MatchupContextValue {
  cleanData: MatchupRow[];
  setCleanData: React.Dispatch<React.SetStateAction<MatchupRow[]>>;
  playRates: Record<string, string>;
  setPlayRates: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  results: Record<string, number> | null;
  setResults: React.Dispatch<React.SetStateAction<Record<string, number> | null>>;
}

const MatchupContext = createContext<MatchupContextValue | null>(null);

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export function MatchupProvider({ children }: { children: ReactNode }) {
  const [cleanData, setCleanData] = useState<MatchupRow[]>([]);
  const [playRates, setPlayRates] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCleanData(readStorage<MatchupRow[]>("pmu_cleanData", []));
    setPlayRates(readStorage<Record<string, string>>("pmu_playRates", {}));
    setResults(readStorage<Record<string, number> | null>("pmu_results", null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("pmu_cleanData", JSON.stringify(cleanData));
  }, [cleanData, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("pmu_playRates", JSON.stringify(playRates));
  }, [playRates, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("pmu_results", JSON.stringify(results));
  }, [results, hydrated]);

  const value = useMemo<MatchupContextValue>(
    () => ({ cleanData, setCleanData, playRates, setPlayRates, results, setResults }),
    [cleanData, playRates, results]
  );

  return <MatchupContext.Provider value={value}>{children}</MatchupContext.Provider>;
}

export function useMatchupStore() {
  const context = useContext(MatchupContext);
  if (!context) {
    throw new Error("useMatchupStore must be used within MatchupProvider");
  }
  return context;
}
