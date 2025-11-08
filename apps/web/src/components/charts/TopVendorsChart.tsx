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
import { VendorSpend } from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  data: VendorSpend[];
}

export default function TopVendorsChart({ data }: Props) {
  const chartData = {
    labels: data.map((d) => d.vendor_name),
    datasets: [
      {
        label: "Total Spend",
        data: data.map((d) => d.spend),
        backgroundColor: [
          "#312e81", // Deep purple - Global Supply
          "#4338ca", // Purple
          "#4f46e5", // Indigo  
          "#6366f1", // Light indigo
          "#818cf8", // Lighter indigo
          "#a5b4fc", // Pale indigo
          "#c7d2fe", // Very pale
          "#ddd6fe", // Almost white
          "#e0e7ff",
          "#ede9fe",
        ],
        borderRadius: 4,
        barThickness: 20,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
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
            return 'Total: €' + context.parsed.x.toLocaleString();
          }
        }
      },
    },
    scales: {
      x: {
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
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}
