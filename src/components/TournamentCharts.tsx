import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BatchResults } from "@/types/tournament";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TournamentChartsProps {
  results: BatchResults;
  deckNames: string[];
  metaPercentages: { [deck: string]: number };
  nPlayers: number;
}

export function TournamentCharts({
  results,
  deckNames,
  metaPercentages,
  nPlayers,
}: TournamentChartsProps) {
  const { t16Map, t32Map, t64Map, t128Map, t256Map, day2Map } = results;

  // Prepare data for stacked bar chart
  const stackedData = {
    labels: deckNames,
    datasets: [
      {
        label: "Top 16",
        data: deckNames.map((deck) => t16Map.get(deck) || 0),
        backgroundColor: "rgba(255, 99, 132, 0.8)",
      },
      {
        label: "17-32",
        data: deckNames.map(
          (deck) => (t32Map.get(deck) || 0) - (t16Map.get(deck) || 0)
        ),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
      {
        label: "33-64",
        data: deckNames.map(
          (deck) => (t64Map.get(deck) || 0) - (t32Map.get(deck) || 0)
        ),
        backgroundColor: "rgba(255, 206, 86, 0.8)",
      },
      {
        label: "65-128",
        data: deckNames.map(
          (deck) => (t128Map.get(deck) || 0) - (t64Map.get(deck) || 0)
        ),
        backgroundColor: "rgba(75, 192, 192, 0.8)",
      },
      {
        label: "129-256",
        data: deckNames.map(
          (deck) => (t256Map.get(deck) || 0) - (t128Map.get(deck) || 0)
        ),
        backgroundColor: "rgba(153, 102, 255, 0.8)",
      },
      {
        label: "Day 2 Rest",
        data: deckNames.map(
          (deck) => (day2Map.get(deck) || 0) - (t256Map.get(deck) || 0)
        ),
        backgroundColor: "rgba(255, 159, 64, 0.8)",
      },
    ],
  };

  // Meta percentages comparison
  const normalizedMeta = Object.values(metaPercentages);
  const total = normalizedMeta.reduce((a, b) => a + b, 0);
  const day1Percentages = normalizedMeta.map((p) => p / total);

  const totalDay2 = deckNames.reduce(
    (sum, deck) => sum + (day2Map.get(deck) || 0),
    0
  );
  const day2Percentages = deckNames.map(
    (deck) => (day2Map.get(deck) || 0) / totalDay2
  );

  const metaComparisonData = {
    labels: deckNames,
    datasets: [
      {
        label: "Day 1 Meta %",
        data: day1Percentages.map((p) => p * 100),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
      },
      {
        label: "Day 2 Meta %",
        data: day2Percentages.map((p) => p * 100),
        backgroundColor: "rgba(255, 99, 132, 0.8)",
      },
    ],
  };

  // Conversion rates
  const day1Numbers = day1Percentages.map(
    (p) => Math.round(nPlayers * p) * 100
  );
  const day2Numbers = deckNames.map((deck) => day2Map.get(deck) || 0);
  const conversionRates = day1Numbers.map((day1, i) =>
    day1 > 0 ? (day2Numbers[i] / day1) * 100 : 0
  );

  const conversionData = {
    labels: deckNames,
    datasets: [
      {
        label: "Day 2 Conversion Rate (%)",
        data: conversionRates,
        backgroundColor: "rgba(75, 192, 192, 0.8)",
      },
    ],
  };

  // Top 16 composition
  const top16Numbers = deckNames.map((deck) => t16Map.get(deck) || 0);
  const totalTop16 = top16Numbers.reduce((a, b) => a + b, 0);
  const top16Composition = top16Numbers.map(
    (count) => (count / totalTop16) * 16
  );

  const top16Data = {
    labels: deckNames,
    datasets: [
      {
        label: "Average Top 16 Count",
        data: top16Composition,
        backgroundColor: "rgba(153, 102, 255, 0.8)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Day 2 Threshold Numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar
            data={stackedData}
            options={{
              ...chartOptions,
              plugins: { ...chartOptions.plugins, legend: { position: "top" } },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta Percentages Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar data={metaComparisonData} options={chartOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Day 2 Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar data={conversionData} options={chartOptions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Top 16 Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar data={top16Data} options={chartOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
