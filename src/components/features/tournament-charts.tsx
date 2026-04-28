"use client";

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
import { Card, CardBody, CardHeader } from "@heroui/react";
import type { BatchResults } from "@/types/tournament";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TournamentChartsProps {
  results: BatchResults;
  deckNames: string[];
}

export function TournamentCharts({ results, deckNames }: TournamentChartsProps) {
  const { t16Map, t32Map, t64Map, t128Map, t256Map, day2Map, day1Map } = results;
  const allDeckNames = Array.from(new Set([...deckNames, ...Array.from(day1Map.keys())]));
  const totalDay1 = allDeckNames.reduce((sum, deck) => sum + (day1Map.get(deck) || 0), 0);
  const totalDay2 = allDeckNames.reduce((sum, deck) => sum + (day2Map.get(deck) || 0), 0);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      x: { ticks: { maxRotation: 45 } },
    },
  };

  const stackedData = {
    labels: allDeckNames,
    datasets: [
      { label: "Top 16", data: allDeckNames.map((deck) => t16Map.get(deck) || 0), backgroundColor: "rgba(255, 99, 132, 0.8)" },
      { label: "17-32", data: allDeckNames.map((deck) => (t32Map.get(deck) || 0) - (t16Map.get(deck) || 0)), backgroundColor: "rgba(54, 162, 235, 0.8)" },
      { label: "33-64", data: allDeckNames.map((deck) => (t64Map.get(deck) || 0) - (t32Map.get(deck) || 0)), backgroundColor: "rgba(255, 206, 86, 0.8)" },
      { label: "65-128", data: allDeckNames.map((deck) => (t128Map.get(deck) || 0) - (t64Map.get(deck) || 0)), backgroundColor: "rgba(75, 192, 192, 0.8)" },
      { label: "129-256", data: allDeckNames.map((deck) => (t256Map.get(deck) || 0) - (t128Map.get(deck) || 0)), backgroundColor: "rgba(153, 102, 255, 0.8)" },
      { label: "Day 2 Rest", data: allDeckNames.map((deck) => (day2Map.get(deck) || 0) - (t256Map.get(deck) || 0)), backgroundColor: "rgba(255, 159, 64, 0.8)" },
    ],
  };

  const metaComparisonData = {
    labels: allDeckNames,
    datasets: [
      { label: "Day 1 Meta %", data: allDeckNames.map((deck) => ((day1Map.get(deck) || 0) / totalDay1) * 100), backgroundColor: "rgba(54, 162, 235, 0.8)" },
      { label: "Day 2 Meta %", data: allDeckNames.map((deck) => ((day2Map.get(deck) || 0) / totalDay2) * 100), backgroundColor: "rgba(255, 99, 132, 0.8)" },
    ],
  };

  const conversionData = {
    labels: allDeckNames,
    datasets: [
      {
        label: "Day 2 Conversion Rate (%)",
        data: allDeckNames.map((deck) => {
          const day1 = day1Map.get(deck) || 0;
          const day2 = day2Map.get(deck) || 0;
          return day1 > 0 ? (day2 / day1) * 100 : 0;
        }),
        backgroundColor: "rgba(75, 192, 192, 0.8)",
      },
    ],
  };

  const top16Data = {
    labels: allDeckNames,
    datasets: [
      {
        label: "Average Top 16 Count",
        data: allDeckNames.map((deck) => ((t16Map.get(deck) || 0) / Math.max(1, Array.from(t16Map.values()).reduce((a, b) => a + b, 0))) * 16),
        backgroundColor: "rgba(153, 102, 255, 0.8)",
      },
    ],
  };

  const sections = [
    { title: "Day 2 Threshold Numbers", data: stackedData },
    { title: "Meta Percentages Comparison", data: metaComparisonData },
    { title: "Day 2 Conversion Rate", data: conversionData },
    { title: "Average Top 16 Composition", data: top16Data },
  ];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <h3>{section.title}</h3>
          </CardHeader>
          <CardBody>
            <Bar data={section.data} options={chartOptions} />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
