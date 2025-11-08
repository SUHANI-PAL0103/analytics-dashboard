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
          "#1E1B4B", // Dark navy - OmegaLtd (darkest)
          "#312E81", // Navy - DeltaServices
          "#4338CA", // Medium navy - PrimeVendors
          "#5B21B6", // Purple - Test Solutions  
          "#6366F1", // Indigo - AcmeCorp
          "#818CF8", // Light indigo
          "#A5B4FC", // Lighter
          "#C7D2FE", // Even lighter
          "#E0E7FF", // Very pale
          "#EDE9FE", // Almost white
        ],
        borderRadius: 6,
        barThickness: 24,
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
