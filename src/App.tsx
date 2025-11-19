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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TournamentSimulator } from "@/components/TournamentSimulator";
import { Info } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"analyzer" | "simulator">(
    "analyzer"
  );
  const [cleanData, setCleanData] = useState<MatchupRow[]>(() => {
    const saved = localStorage.getItem("pmu_cleanData");
    return saved ? JSON.parse(saved) : [];
  });
  const [playRates, setPlayRates] = useState<{ [deck: string]: string }>(() => {
    const saved = localStorage.getItem("pmu_playRates");
    return saved ? JSON.parse(saved) : {};
  });
  const [results, setResults] = useState<{ [deck: string]: number } | null>(
    () => {
      const saved = localStorage.getItem("pmu_results");
      return saved ? JSON.parse(saved) : null;
    }
  );

  // Save to localStorage whenever state changes
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

  const decks = Array.from(new Set(cleanData.map((row) => row.deck1)));

  return (
    <TooltipProvider>
      <div style={{ maxWidth: 1200, margin: "2rem auto", padding: 20 }}>
        <h1 className="text-3xl font-bold mb-6">Pokémon TCG Analysis Tools</h1>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <Button
            variant={activeTab === "analyzer" ? "default" : "outline"}
            onClick={() => setActiveTab("analyzer")}
          >
            Matchup Analyzer
          </Button>
          <Button
            variant={activeTab === "simulator" ? "default" : "outline"}
            onClick={() => setActiveTab("simulator")}
          >
            Tournament Simulator
          </Button>
        </div>

        {activeTab === "analyzer" && (
          <Card>
            <CardHeader>
              <CardTitle>Matchup Analyzer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Please use data from{" "}
                <a
                  className="text-blue-700"
                  href="https://www.trainerhill.com/meta?game=PTCG"
                >
                  TrainerHill's meta analysis
                </a>{" "}
                to use this tool. You can export the csv data from trainerhill
                to upload here.
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mb-6"
              />

              {decks.length > 0 && (
                <div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Deck</TableHead>
                          <TableHead>Play Rate (%)</TableHead>
                          {results && (
                            <TableHead>
                              <div className="flex items-center gap-1">
                                Result
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-gray-500 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      The higher the percentage, the better the
                                      perceived matchups this deck has into the
                                      room based on the meta distribution.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {decks.map((deck) => (
                          <TableRow key={deck}>
                            <TableCell>{deck}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.1"
                                value={playRates[deck] || ""}
                                onChange={(e) =>
                                  handlePlayRateChange(deck, e.target.value)
                                }
                                placeholder="Enter play rate"
                              />
                            </TableCell>
                            {results && (
                              <TableCell>
                                {(results[deck] * 100).toFixed(2)}%
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button onClick={handleCalculate} className="mt-4">
                    Calculate Expected Win Rates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "simulator" && (
          <TournamentSimulator
            matchupData={cleanData.map((row) => ({
              deck1: row.deck1,
              deck2: row.deck2,
              wins: Number(row.wins),
              losses: Number(row.losses),
              ties: row.ties !== undefined ? Number(row.ties) : undefined,
              total: row.total !== undefined ? Number(row.total) : undefined,
              true_win_rate: row.true_win_rate,
            }))}
            playRates={playRates}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export default App;
