"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Input,
  Label,
  ProgressBar,
  TextField,
  Switch,
  Separator,
  Table,
  Tooltip,
} from "@heroui/react";
import { Info } from "lucide-react";
import { TournamentCharts } from "@/components/features/tournament-charts";
import { useMatchupStore } from "@/components/providers/matchup-provider";
import type { MatchupData, TournamentConfig, BatchResults } from "@/types/tournament";
import type {
  WorkerMessage,
  WorkerResponse,
} from "@/workers/tournamentSimulator.worker";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export function TournamentSimulatorFeature() {
  const { cleanData, playRates } = useMatchupStore();
  const matchupData: MatchupData[] = useMemo(
    () =>
      cleanData.map((row) => ({
        deck1: row.deck1,
        deck2: row.deck2,
        wins: Number(row.wins),
        losses: Number(row.losses),
        ties: row.ties !== undefined ? Number(row.ties) : undefined,
        total: row.total !== undefined ? Number(row.total) : undefined,
        true_win_rate: row.true_win_rate,
      })),
    [cleanData]
  );
  const deckNames = useMemo(
    () => Array.from(new Set(matchupData.map((row) => row.deck1))),
    [matchupData]
  );

  const [nPlayers, setNPlayers] = useState(2600);
  const [numSimulations, setNumSimulations] = useState(100);
  const [metaPercentages, setMetaPercentages] = useState<Record<string, number>>({});
  const [skillPercentages, setSkillPercentages] = useState<Record<string, number>>({});
  const [tuffEnabled, setTuffEnabled] = useState<Record<string, boolean>>({});
  const [tuffCounts, setTuffCounts] = useState<Record<string, number>>({});
  const [results, setResults] = useState<BatchResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSimulation, setCurrentSimulation] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setNPlayers(readStorage("tournament_nPlayers", 2600));
    setNumSimulations(readStorage("tournament_numSimulations", 100));
    setMetaPercentages(readStorage("tournament_metaPercentages", {}));
    setSkillPercentages(readStorage("tournament_skillPercentages", {}));
    setTuffEnabled(readStorage("tournament_tuffEnabled", {}));
    setTuffCounts(readStorage("tournament_tuffCounts", {}));
  }, []);

  useEffect(() => {
    if (!deckNames.length || Object.keys(metaPercentages).length > 0) return;
    const initialMeta: Record<string, number> = {};
    const initialSkill: Record<string, number> = {};
    const initialTuffEnabled: Record<string, boolean> = {};
    const initialTuffCounts: Record<string, number> = {};
    deckNames.forEach((deck) => {
      initialMeta[deck] = 5.88;
      initialSkill[deck] = 10;
      initialTuffEnabled[deck] = false;
      initialTuffCounts[deck] = 5;
    });
    setMetaPercentages(initialMeta);
    setSkillPercentages(initialSkill);
    setTuffEnabled(initialTuffEnabled);
    setTuffCounts(initialTuffCounts);
  }, [deckNames, metaPercentages]);

  useEffect(() => {
    window.localStorage.setItem("tournament_nPlayers", JSON.stringify(nPlayers));
  }, [nPlayers]);
  useEffect(() => {
    window.localStorage.setItem(
      "tournament_numSimulations",
      JSON.stringify(numSimulations)
    );
  }, [numSimulations]);
  useEffect(() => {
    window.localStorage.setItem(
      "tournament_metaPercentages",
      JSON.stringify(metaPercentages)
    );
  }, [metaPercentages]);
  useEffect(() => {
    window.localStorage.setItem(
      "tournament_skillPercentages",
      JSON.stringify(skillPercentages)
    );
  }, [skillPercentages]);
  useEffect(() => {
    window.localStorage.setItem("tournament_tuffEnabled", JSON.stringify(tuffEnabled));
  }, [tuffEnabled]);
  useEffect(() => {
    window.localStorage.setItem("tournament_tuffCounts", JSON.stringify(tuffCounts));
  }, [tuffCounts]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../workers/tournamentSimulator.worker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const { type, progress: p, currentSimulation: current, results: r, error } = event.data;
      if (type === "progress") {
        if (p !== undefined) setProgress(p);
        if (current !== undefined) setCurrentSimulation(current);
      } else if (type === "complete") {
        setIsRunning(false);
        setProgress(100);
        if (r) setResults(r);
      } else if (type === "error") {
        setIsRunning(false);
        alert(`Simulation failed: ${error}`);
      }
    };
    return () => workerRef.current?.terminate();
  }, []);

  const importPlayRates = () => {
    const newMeta: Record<string, number> = {};
    deckNames.forEach((deck) => {
      newMeta[deck] = playRates[deck] ? Number(playRates[deck]) : 0;
    });
    setMetaPercentages(newMeta);
  };

  const createMatchupMatrix = () => {
    const matrix: number[][] = Array(deckNames.length)
      .fill(null)
      .map(() => Array(deckNames.length).fill(0.5));
    matchupData.forEach((row) => {
      const i = deckNames.indexOf(row.deck1);
      const j = deckNames.indexOf(row.deck2);
      if (i !== -1 && j !== -1) matrix[i][j] = row.true_win_rate || 0.5;
    });
    return matrix;
  };

  const runSimulation = () => {
    if (!workerRef.current) return;
    setIsRunning(true);
    setProgress(0);
    setCurrentSimulation(0);
    const config: TournamentConfig = {
      matchupMatrix: createMatchupMatrix(),
      metaPercentages: deckNames.map((deck) => metaPercentages[deck] || 0),
      matchupNames: deckNames,
      n_players: nPlayers,
      skillPercents: deckNames.map((deck) => skillPercentages[deck] || 0),
      isDay2: false,
      tuffEnabled,
      tuffCounts,
    };
    const message: WorkerMessage = { type: "start", config, numSimulations };
    workerRef.current.postMessage(message);
  };

  if (!deckNames.length) {
    return (
      <Card className="rounded-lg shadow-md">
        <Card.Header>
          <h2 className="section-title">Tournament Simulator</h2>
        </Card.Header>
        <Card.Content>Please upload matchup data first to use the simulator.</Card.Content>
      </Card>
    );
  }

  return (
    <div className="results-grid">
      <Card className="rounded-lg shadow-lg">
        <Card.Header>
          <div className="page-stack">
            <h2 className="section-title">Tournament Simulator</h2>
            <p className="section-subtitle">
              Configure player pool assumptions and run Monte Carlo simulations for Day 2 conversion.
            </p>
          </div>
        </Card.Header>
        <Separator />
        <Card.Content className="page-stack">
          <div className="two-col">
            <TextField type="number">
              <Label>Number of Players</Label>
              <Input
                variant="secondary"
                value={String(nPlayers)}
                onChange={(e) => setNPlayers(Number(e.target.value))}
              />
            </TextField>
            <TextField type="number">
              <Label>Number of Simulations</Label>
              <Input
                variant="secondary"
                value={String(numSimulations)}
                onChange={(e) => setNumSimulations(Number(e.target.value))}
              />
            </TextField>
          </div>
          <Button variant="secondary" onPress={importPlayRates}>
            Import Play Rates from Matchup Analyzer
          </Button>
          <Table variant="secondary">
            <Table.ScrollContainer>
              <Table.Content aria-label="Tournament setup table">
                <Table.Header>
                  <Table.Column>Deck</Table.Column>
                  <Table.Column>Meta %</Table.Column>
                  <Table.Column>Skill %</Table.Column>
                  <Table.Column>
                    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                      TUFF
                      <Tooltip delay={0}>
                        <Tooltip.Trigger>
                          <span className="inline-flex">
                            <Info size={14} />
                          </span>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          Tournament-level players with stronger expected edge.
                        </Tooltip.Content>
                      </Tooltip>
                    </span>
                  </Table.Column>
                  <Table.Column>TUFF Count</Table.Column>
                </Table.Header>
                <Table.Body>
              {deckNames.map((deck) => (
                  <Table.Row key={deck} id={deck}>
                    <Table.Cell>{deck}</Table.Cell>
                    <Table.Cell>
                    <Input
                      type="number"
                      step="0.1"
                      value={String(metaPercentages[deck] || 0)}
                      onChange={(e) =>
                        setMetaPercentages((prev) => ({
                          ...prev,
                          [deck]: Number(e.target.value),
                        }))
                      }
                    />
                    </Table.Cell>
                    <Table.Cell>
                    <Input
                      type="number"
                      step="0.1"
                      value={String(skillPercentages[deck] || 0)}
                      onChange={(e) =>
                        setSkillPercentages((prev) => ({
                          ...prev,
                          [deck]: Number(e.target.value),
                        }))
                      }
                    />
                    </Table.Cell>
                    <Table.Cell>
                    <Switch
                      isSelected={tuffEnabled[deck] || false}
                      onChange={(checked) =>
                        setTuffEnabled((prev) => ({ ...prev, [deck]: checked }))
                      }
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                    </Table.Cell>
                    <Table.Cell>
                    {tuffEnabled[deck] ? (
                      <Input
                        type="number"
                        min="0"
                        value={String(tuffCounts[deck] || 0)}
                        onChange={(e) =>
                          setTuffCounts((prev) => ({
                            ...prev,
                            [deck]: Number(e.target.value),
                          }))
                        }
                      />
                    ) : (
                      "-"
                    )}
                    </Table.Cell>
                  </Table.Row>
              ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
          <Button variant="primary" onPress={runSimulation} isDisabled={isRunning}>
            {isRunning ? "Running Simulation..." : "Run Tournament Simulation"}
          </Button>
          {isRunning ? (
            <div className="page-stack">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>Progress: {Math.round(progress)}%</span>
                <span>
                  Simulation {currentSimulation} of {numSimulations}
                </span>
              </div>
              <ProgressBar value={progress} aria-label="Simulation progress">
                <Label>Progress</Label>
                <ProgressBar.Output />
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
            </div>
          ) : null}
        </Card.Content>
      </Card>
      {results ? <TournamentCharts results={results} deckNames={deckNames} /> : null}
    </div>
  );
}
