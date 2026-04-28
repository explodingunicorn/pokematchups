"use client";

import Papa from "papaparse";
import { Button, Card, CardBody, CardHeader, Input, Link, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react";
import { Info } from "lucide-react";
import { useMemo } from "react";
import { useMatchupStore } from "@/components/providers/matchup-provider";
import type { MatchupRow } from "@/types/matchup";

function removeDuplicates(data: MatchupRow[]): MatchupRow[] {
  const seen = new Set<string>();
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

export function MatchupAnalyzer() {
  const { cleanData, playRates, results, setCleanData, setPlayRates, setResults } =
    useMatchupStore();

  const decks = useMemo(
    () => Array.from(new Set(cleanData.map((row) => row.deck1))),
    [cleanData]
  );

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    Papa.parse<MatchupRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsedResults) => {
        let data = parsedResults.data as MatchupRow[];
        data = removeDuplicates(data);
        data = data.map((row) => ({
          ...row,
          true_win_rate: calculateTrueWinRate(row),
        }));
        setCleanData(data);
        const initialRates: Record<string, string> = {};
        Array.from(new Set(data.map((row) => row.deck1))).forEach((deck) => {
          initialRates[deck] = "";
        });
        setPlayRates(initialRates);
        setResults(null);
      },
    });
  };

  const handleCalculate = () => {
    const playRatesNum: Record<string, number> = {};
    Object.keys(playRates).forEach((deck) => {
      playRatesNum[deck] = parseFloat(playRates[deck]) / 100 || 0;
    });
    const sumProducts: Record<string, number> = {};
    Object.keys(playRates).forEach((deck1) => {
      const matchups = cleanData.filter((row) => row.deck1 === deck1);
      let sum = 0;
      matchups.forEach((row) => {
        sum += (playRatesNum[row.deck2] || 0) * (row.true_win_rate ?? 0);
      });
      sumProducts[deck1] = sum;
    });
    setResults(sumProducts);
  };

  return (
    <Card>
      <CardHeader>
        <h2>Matchup Analyzer</h2>
      </CardHeader>
      <CardBody>
        <p>
          Please use data from{" "}
          <Link isExternal href="https://www.trainerhill.com/meta?game=PTCG">
            TrainerHill&apos;s meta analysis
          </Link>{" "}
          and export CSV to upload.
        </p>
        <Input
          type="file"
          accept=".csv"
          onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
          style={{ marginTop: 16, marginBottom: 24 }}
        />
        {decks.length > 0 ? (
          <>
            <Table aria-label="Deck matchup analyzer table">
              <TableHeader>
                <TableColumn>Deck</TableColumn>
                <TableColumn>Play Rate (%)</TableColumn>
                <TableColumn>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    Result
                    <Tooltip content="The higher the percentage, the better the deck is positioned into the room.">
                      <Info size={14} />
                    </Tooltip>
                  </span>
                </TableColumn>
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
                          setPlayRates((prev) => ({ ...prev, [deck]: e.target.value }))
                        }
                        placeholder="Enter play rate"
                      />
                    </TableCell>
                    <TableCell>
                      {results ? `${(results[deck] * 100).toFixed(2)}%` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button color="primary" onPress={handleCalculate} style={{ marginTop: 16 }}>
              Calculate Expected Win Rates
            </Button>
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
