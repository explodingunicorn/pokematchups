"use client";

import Papa from "papaparse";
import {
  Button,
  Card,
  Input,
  Link,
  Table,
  Tooltip,
  Separator,
} from "@heroui/react";
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
    <Card className="rounded-lg shadow-lg">
      <Card.Header>
        <div className="page-stack">
          <h2 className="section-title">Matchup Analyzer</h2>
          <p className="section-subtitle">
            Upload matchup CSV data and compare deck expected performance into a projected meta.
          </p>
        </div>
      </Card.Header>
      <Separator />
      <Card.Content>
        <p className="section-subtitle">
          Please use data from{" "}
          <Link
            href="https://www.trainerhill.com/meta?game=PTCG"
            target="_blank"
            rel="noopener noreferrer"
          >
            TrainerHill&apos;s meta analysis
            <Link.Icon />
          </Link>{" "}
          and export CSV to upload.
        </p>
        <Input
          type="file"
          accept=".csv"
          variant="secondary"
          onChange={(e) => handleFileUpload(e.target.files?.[0] ?? null)}
          className="mt-4 mb-6"
        />
        {decks.length > 0 ? (
          <div className="page-stack">
            <Table variant="secondary">
              <Table.ScrollContainer>
                <Table.Content aria-label="Deck matchup analyzer table" className="min-h-[260px]">
                  <Table.Header>
                    <Table.Column>Deck</Table.Column>
                    <Table.Column>Play Rate (%)</Table.Column>
                    <Table.Column>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Result
                        <Tooltip delay={0}>
                          <Tooltip.Trigger>
                            <span className="inline-flex">
                              <Info size={14} />
                            </span>
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            The higher the percentage, the better the deck is positioned into the room.
                          </Tooltip.Content>
                        </Tooltip>
                      </span>
                    </Table.Column>
                  </Table.Header>
                  <Table.Body>
                {decks.map((deck) => (
                    <Table.Row key={deck} id={deck}>
                      <Table.Cell>{deck}</Table.Cell>
                      <Table.Cell>
                      <Input
                        type="number"
                        step="0.1"
                        value={playRates[deck] || ""}
                        onChange={(e) =>
                          setPlayRates((prev) => ({ ...prev, [deck]: e.target.value }))
                        }
                        placeholder="Enter play rate"
                      />
                      </Table.Cell>
                      <Table.Cell>{results ? `${(results[deck] * 100).toFixed(2)}%` : "-"}</Table.Cell>
                    </Table.Row>
                ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
            <Button variant="primary" onPress={handleCalculate}>
              Calculate Expected Win Rates
            </Button>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  );
}
