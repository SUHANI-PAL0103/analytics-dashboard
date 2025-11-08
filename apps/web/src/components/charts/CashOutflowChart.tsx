"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CashOutflowChart() {
  // Sample forecast data
  const chartData = {
    labels: ["0-7 days", "8-30 days", "31-60 days", "60+ days"],
    datasets: [
      {
        label: "Expected Outflow",
        data: [4800, 8200, 3400, 12400],
        backgroundColor: "#1E1B4B", // Dark navy (Figma)
        borderRadius: 6,
        barThickness: 60,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        callbacks: {
          label: function(context: any) {
            return 'Amount: €' + context.parsed.y.toLocaleString();
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#f3f4f6",
        },
        ticks: {
          color: "#6b7280",
          callback: function(value: any) {
            return '€' + (value / 1000).toFixed(0) + 'k';
          }
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6b7280",
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
