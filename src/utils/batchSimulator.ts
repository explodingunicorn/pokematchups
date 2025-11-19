import type {
  BatchResults,
  TournamentConfig,
  Player,
} from "../types/tournament";
import { tourneySim } from "./tournamentSimulator";

export function runBatchSimulations(
  config: TournamentConfig,
  numSimulations: number = 1000
): BatchResults {
  const t16Map = new Map<string, number>();
  const t32Map = new Map<string, number>();
  const t64Map = new Map<string, number>();
  const t128Map = new Map<string, number>();
  const t256Map = new Map<string, number>();
  const day2Map = new Map<string, number>();
  const day1Map = new Map<string, number>();

  // Initialize maps
  config.matchupNames.forEach((deck) => {
    t16Map.set(deck, 0);
    t32Map.set(deck, 0);
    t64Map.set(deck, 0);
    t128Map.set(deck, 0);
    t256Map.set(deck, 0);
    day2Map.set(deck, 0);
    day1Map.set(deck, 0);
  });

  let day1Records: Player[] | undefined = undefined;

  for (let simNum = 1; simNum <= 2 * numSimulations; simNum++) {
    const isDay2 = simNum % 2 === 0;
    const simConfig = { ...config, isDay2 };

    // Pass day1Records for Day 2 simulations
    const results = tourneySim(simConfig, {
      useLocalStorage: true,
      day1Records: isDay2 ? day1Records : undefined,
    });

    // Store Day 1 records for the next Day 2 simulation
    if (!isDay2) {
      day1Records = results.allRecords;

      // Track actual Day 1 player counts
      const allDay1Decks = results.allRecords.map((p) => p.deck);
      const uniqueDecks = Array.from(new Set(allDay1Decks));

      // Initialize any new decks (like "Other") that weren't in the original config
      uniqueDecks.forEach((deck) => {
        if (!day1Map.has(deck)) {
          day1Map.set(deck, 0);
          t16Map.set(deck, 0);
          t32Map.set(deck, 0);
          t64Map.set(deck, 0);
          t128Map.set(deck, 0);
          t256Map.set(deck, 0);
          day2Map.set(deck, 0);
        }
      });

      uniqueDecks.forEach((deck) => {
        const countDay1 = allDay1Decks.filter((d) => d === deck).length;
        day1Map.set(deck, day1Map.get(deck)! + countDay1);
      });
    }

    if (isDay2) {
      const allRecords = results.allRecords;

      const top16Decks = allRecords.slice(0, 16).map((p) => p.deck);
      const top32Decks = allRecords.slice(0, 32).map((p) => p.deck);
      const top64Decks = allRecords.slice(0, 64).map((p) => p.deck);
      const top128Decks = allRecords.slice(0, 128).map((p) => p.deck);
      const top256Decks = allRecords.slice(0, 256).map((p) => p.deck);
      const allDay2Decks = allRecords.map((p) => p.deck);

      const uniqueDecks = Array.from(new Set(allDay2Decks));

      uniqueDecks.forEach((deck) => {
        const count16 = top16Decks.filter((d) => d === deck).length;
        const count32 = top32Decks.filter((d) => d === deck).length;
        const count64 = top64Decks.filter((d) => d === deck).length;
        const count128 = top128Decks.filter((d) => d === deck).length;
        const count256 = top256Decks.filter((d) => d === deck).length;
        const countDay2 = allDay2Decks.filter((d) => d === deck).length;

        t16Map.set(deck, (t16Map.get(deck) || 0) + count16);
        t32Map.set(deck, (t32Map.get(deck) || 0) + count32);
        t64Map.set(deck, (t64Map.get(deck) || 0) + count64);
        t128Map.set(deck, (t128Map.get(deck) || 0) + count128);
        t256Map.set(deck, (t256Map.get(deck) || 0) + count256);
        day2Map.set(deck, (day2Map.get(deck) || 0) + countDay2);
      });
    }
  }

  return { t16Map, t32Map, t64Map, t128Map, t256Map, day2Map, day1Map };
}
