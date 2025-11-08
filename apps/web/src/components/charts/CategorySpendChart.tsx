"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { CategorySpend } from "@/lib/api";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: CategorySpend[];
}

export default function CategorySpendChart({ data }: Props) {
  const colors = [
    "#fbbf24", // Operations - orange/yellow
    "#f97316", // Marketing - orange
    "#3b82f6", // R&D - blue
  ];

  const chartData = {
    labels: data.map((d) => d.category || 'Uncategorized'),
    datasets: [
      {
        label: "Spend",
        data: data.map((d) => d.spend),
        backgroundColor: colors.slice(0, data.length),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          color: "#6b7280",
          font: {
            size: 12,
          },
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const total = data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(0);
                return {
                  text: `${label} (€${(value / 1000).toFixed(1)}k)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          }
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return ` ${percentage}% (€${context.parsed.toLocaleString()})`;
          }
        }
      },
    },
  };

  return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-full h-full">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}
