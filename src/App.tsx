import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MatchupRow {
  deck1: string;
  deck2: string;
  wins: string | number;
  losses: string | number;
  ties?: string | number;
  total?: string | number;
  true_win_rate?: number;
}

function removeDuplicates(data: MatchupRow[]): MatchupRow[] {
  const seen = new Set();
  return data.filter((row) => {
    const key = `${row.deck1}|${row.deck2}|${row.wins}|${row.losses}|${row.ties}|${row.total}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateTrueWinRate(row: MatchupRow): number {
  const wins = Number(row.wins);
  const losses = Number(row.losses);
  if (wins + losses === 0) return 0;
  return wins / (wins + losses);
}

function App() {
  const [cleanData, setCleanData] = useState<MatchupRow[]>(() => {
    const saved = localStorage.getItem("pmu_cleanData");
    return saved ? JSON.parse(saved) : [];
  });
  const [playRates, setPlayRates] = useState<{ [deck: string]: string }>(() => {
    const saved = localStorage.getItem("pmu_playRates");
    return saved ? JSON.parse(saved) : {};
  });
  const [results, setResults] = useState<{ [deck: string]: number } | null>(() => {
    const saved = localStorage.getItem("pmu_results");
    return saved ? JSON.parse(saved) : null;
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("pmu_cleanData", JSON.stringify(cleanData));
  }, [cleanData]);
  useEffect(() => {
    localStorage.setItem("pmu_playRates", JSON.stringify(playRates));
  }, [playRates]);
  useEffect(() => {
    localStorage.setItem("pmu_results", JSON.stringify(results));
  }, [results]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<MatchupRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let data = results.data as MatchupRow[];
        data = removeDuplicates(data);
        data = data.map((row) => ({
          ...row,
          true_win_rate: calculateTrueWinRate(row),
        }));
        setCleanData(data);
        // Initialize play rates for each unique deck1
        const decks = Array.from(new Set(data.map((row) => row.deck1)));
        const initialRates: { [key: string]: string } = {};
        decks.forEach((deck) => {
          initialRates[deck] = "";
        });
        setPlayRates(initialRates);
        setResults(null);
      },
    });
  };

  const handlePlayRateChange = (deck: string, value: string) => {
    setPlayRates((prev) => ({ ...prev, [deck]: value }));
  };

  const handleCalculate = () => {
    const decks = Object.keys(playRates);
    const playRatesNum: { [deck: string]: number } = {};
    decks.forEach((deck) => {
      playRatesNum[deck] = parseFloat(playRates[deck]) / 100 || 0;
    });
    const sumProducts: { [deck: string]: number } = {};
    decks.forEach((deck1) => {
      const matchups = cleanData.filter((row) => row.deck1 === deck1);
      let sum = 0;
      matchups.forEach((row) => {
        const deck2 = row.deck2;
        const pr = playRatesNum[deck2] || 0;
        sum += pr * (row.true_win_rate ?? 0);
      });
      sumProducts[deck1] = sum;
    });
    setResults(sumProducts);
  };

  const handleReset = () => {
    setCleanData([]);
    setPlayRates({});
    setResults(null);
    localStorage.removeItem("pmu_cleanData");
    localStorage.removeItem("pmu_playRates");
    localStorage.removeItem("pmu_results");
  };

  const decks = Object.keys(playRates);

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: 20 }}>
      <h1>Pokémon TCG Matchup Analyzer</h1>
      <Input type="file" accept=".csv" onChange={handleFileUpload} />
      {decks.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deck</TableHead>
                  <TableHead>Play Rate (%)</TableHead>
                  {results && <TableHead>Result</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {decks.map((deck) => (
                  <TableRow key={deck}>
                    <TableCell>{deck}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={playRates[deck]}
                        onChange={(e) => handlePlayRateChange(deck, e.target.value)}
                        className="w-24"
                        disabled={!!results}
                      />
                    </TableCell>
                    {results && (
                      <TableCell>
                        {results[deck] !== undefined ? results[deck].toFixed(4) : "-"}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-4 mt-5">
            {!results && (
              <Button onClick={handleCalculate}>
                Calculate Sum Products
              </Button>
            )}
            <Button onClick={handleReset} variant="secondary">
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
