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
          "#1E1B4B", // Dark navy - Global Supply (Figma)
          "#312E81", // Navy
          "#3730A3", // Medium navy  
          "#4338CA", // Indigo
          "#4F46E5", // Light indigo
          "#6366F1", // Lighter indigo
          "#818CF8", // Even lighter
          "#A5B4FC", // Pale
          "#C7D2FE", // Very pale
          "#E0E7FF", // Almost white
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
