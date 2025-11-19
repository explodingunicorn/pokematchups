import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type {
  TournamentConfig,
  MatchupData,
  BatchResults,
} from "@/types/tournament";
import { TournamentCharts } from "./TournamentCharts";
import type {
  WorkerMessage,
  WorkerResponse,
} from "@/workers/tournamentSimulator.worker";

interface TournamentSimulatorProps {
  matchupData: MatchupData[];
  playRates?: { [deck: string]: string };
}

export function TournamentSimulator({
  matchupData,
  playRates,
}: TournamentSimulatorProps) {
  const [nPlayers, setNPlayers] = useState(2600);
  const [numSimulations, setNumSimulations] = useState(100);
  const [metaPercentages, setMetaPercentages] = useState<{
    [deck: string]: number;
  }>({});
  const [skillPercentages, setSkillPercentages] = useState<{
    [deck: string]: number;
  }>({});
  const [tuffEnabled, setTuffEnabled] = useState<{ [deck: string]: boolean }>(
    {}
  );
  const [tuffCounts, setTuffCounts] = useState<{ [deck: string]: number }>({});
  const [results, setResults] = useState<BatchResults | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSimulation, setCurrentSimulation] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  // Get unique deck names from matchup data
  const deckNames = Array.from(new Set(matchupData.map((row) => row.deck1)));

  // Initialize meta and skill percentages if empty
  React.useEffect(() => {
    if (deckNames.length > 0 && Object.keys(metaPercentages).length === 0) {
      const initialMeta: { [deck: string]: number } = {};
      const initialSkill: { [deck: string]: number } = {};
      const initialTuffEnabled: { [deck: string]: boolean } = {};
      const initialTuffCounts: { [deck: string]: number } = {};

      deckNames.forEach((deck) => {
        initialMeta[deck] = 5.88; // Default equal distribution
        initialSkill[deck] = 10; // Default 10% skilled players
        initialTuffEnabled[deck] = false; // TUFF disabled by default
        initialTuffCounts[deck] = 5; // Default 5 TUFF players
      });

      setMetaPercentages(initialMeta);
      setSkillPercentages(initialSkill);
      setTuffEnabled(initialTuffEnabled);
      setTuffCounts(initialTuffCounts);
    }
  }, [deckNames]);

  // Function to import play rates from matchup analyzer
  const importPlayRates = () => {
    if (!playRates) return;

    const newMetaPercentages: { [deck: string]: number } = {};
    deckNames.forEach((deck) => {
      const rate = playRates[deck];
      newMetaPercentages[deck] = rate ? Number(rate) : 0;
    });

    setMetaPercentages(newMetaPercentages);
  };

  // Initialize and cleanup Web Worker
  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL("../workers/tournamentSimulator.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Set up message handler
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const {
        type,
        progress: prog,
        currentSimulation: curr,
        results: res,
        error,
      } = event.data;

      if (type === "progress") {
        if (prog !== undefined) setProgress(prog);
        if (curr !== undefined) setCurrentSimulation(curr);
      } else if (type === "complete") {
        setIsRunning(false);
        setProgress(100);
        if (res) setResults(res);
      } else if (type === "error") {
        setIsRunning(false);
        console.error("Simulation failed:", error);
        alert(`Simulation failed: ${error}`);
      }
    };

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const createMatchupMatrix = (): number[][] => {
    const matrix: number[][] = Array(deckNames.length)
      .fill(null)
      .map(() => Array(deckNames.length).fill(0.5));

    matchupData.forEach((row) => {
      const deck1Index = deckNames.indexOf(row.deck1);
      const deck2Index = deckNames.indexOf(row.deck2);

      if (deck1Index !== -1 && deck2Index !== -1) {
        matrix[deck1Index][deck2Index] = row.true_win_rate || 0.5;
      }
    });

    return matrix;
  };

  const runSimulation = () => {
    if (!workerRef.current) {
      console.error("Worker not initialized");
      return;
    }

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

    const message: WorkerMessage = {
      type: "start",
      config,
      numSimulations,
    };

    workerRef.current.postMessage(message);
  };

  if (deckNames.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tournament Simulator</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Please upload matchup data first to use the tournament simulator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Players
              </label>
              <Input
                type="number"
                value={nPlayers}
                onChange={(e) => setNPlayers(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Simulations
              </label>
              <Input
                type="number"
                value={numSimulations}
                onChange={(e) => setNumSimulations(Number(e.target.value))}
              />
            </div>
          </div>

          {playRates && Object.keys(playRates).length > 0 && (
            <div className="mb-4">
              <Button
                onClick={importPlayRates}
                variant="outline"
                className="w-full"
              >
                Import Play Rates from Matchup Analyzer
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deck</TableHead>
                  <TableHead>Meta %</TableHead>
                  <TableHead>Skill %</TableHead>
                  <TableHead>TUFF</TableHead>
                  <TableHead>TUFF Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deckNames.map((deck) => (
                  <TableRow key={deck}>
                    <TableCell className="font-medium">{deck}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        className="w-20"
                        value={metaPercentages[deck] || 0}
                        onChange={(e) =>
                          setMetaPercentages((prev) => ({
                            ...prev,
                            [deck]: Number(e.target.value),
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        className="w-20"
                        value={skillPercentages[deck] || 0}
                        onChange={(e) =>
                          setSkillPercentages((prev) => ({
                            ...prev,
                            [deck]: Number(e.target.value),
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={tuffEnabled[deck] || false}
                        onCheckedChange={(checked: boolean) =>
                          setTuffEnabled((prev) => ({
                            ...prev,
                            [deck]: checked,
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {tuffEnabled[deck] && (
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          className="w-20"
                          value={tuffCounts[deck] || 0}
                          onChange={(e) =>
                            setTuffCounts((prev) => ({
                              ...prev,
                              [deck]: Number(e.target.value),
                            }))
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button
            onClick={runSimulation}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? "Running Simulation..." : "Run Tournament Simulation"}
          </Button>

          {isRunning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {Math.round(progress)}%</span>
                <span>
                  Simulation {currentSimulation} of {numSimulations}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results && <TournamentCharts results={results} deckNames={deckNames} />}
    </div>
  );
}
