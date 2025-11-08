"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { InvoiceTrend } from "@/lib/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  data: InvoiceTrend[];
}

export default function InvoiceTrendsChart({ data }: Props) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Invoice count",
        data: data.map((d) => d.invoice_count),
        borderColor: "#1E1B4B", // Dark navy (Figma)
        backgroundColor: "rgba(30, 27, 75, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y",
        pointRadius: 4,
        pointBackgroundColor: "#1E1B4B",
        borderWidth: 2,
      },
      {
        label: "Total Spend",
        data: data.map((d) => d.spend),
        borderColor: "#6366F1", // Light indigo (Figma)
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y1",
        pointRadius: 4,
        pointBackgroundColor: "#6366F1",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: false,
        },
        grid: {
          color: "#f3f4f6",
        },
        ticks: {
          color: "#6b7280",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: false,
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#6b7280",
          callback: function(value: any) {
            return '€ ' + value.toLocaleString();
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
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          color: "#6b7280",
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}
