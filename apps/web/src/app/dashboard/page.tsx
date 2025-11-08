"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, DashboardStats, InvoiceTrend, VendorSpend, CategorySpend } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import InvoiceTrendsChart from "@/components/charts/InvoiceTrendsChart";
import TopVendorsChart from "@/components/charts/TopVendorsChart";
import CategorySpendChart from "@/components/charts/CategorySpendChart";
import CashOutflowChart from "@/components/charts/CashOutflowChart";
import InvoicesTable from "@/components/InvoicesTable";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<InvoiceTrend[]>([]);
  const [topVendors, setTopVendors] = useState<VendorSpend[]>([]);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, trendsData, vendorsData, categoryData] = await Promise.all([
          api.getStats(),
          api.getInvoiceTrends(),
          api.getTopVendors(),
          api.getCategorySpend(),
        ]);
        
        setStats(statsData);
        setTrends(trendsData);
        setTopVendors(vendorsData);
        setCategorySpend(categoryData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Total Spend",
      period: "(YTD)",
      value: stats ? formatCurrency(stats.total_spend_ytd) : "€ 12.679,25",
      trend: "+8.2%",
      trendUp: true,
      trendText: "from last month",
    },
    {
      title: "Total Invoices Processed",
      period: "",
      value: stats?.total_invoices.toLocaleString() || "64",
      trend: "+8.2%",
      trendUp: true,
      trendText: "from last month",
    },
    {
      title: "Documents Uploaded",
      period: "This Month",
      value: stats?.documents_uploaded.toLocaleString() || "17",
      trend: "-8",
      trendUp: false,
      trendText: "less from last month",
    },
    {
      title: "Average Invoice Value",
      period: "",
      value: stats ? formatCurrency(stats.average_invoice_value) : "€ 2.455,00",
      trend: "+8.2%",
      trendUp: true,
      trendText: "from last month",
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-normal text-gray-900 mb-0.5">
                    {card.title}
                  </div>
                  {card.period && (
                    <div className="text-xs text-gray-500">{card.period}</div>
                  )}
                </div>
                {/* Mini trend chart */}
                <div className="w-20 h-10 ml-2">
                  <svg viewBox="0 0 80 40" className="w-full h-full" preserveAspectRatio="none">
                    <polyline
                      points={card.trendUp ? "0,35 20,28 40,22 60,15 80,8" : "0,8 20,15 40,22 60,28 80,35"}
                      fill="none"
                      stroke={card.trendUp ? "#10b981" : "#ef4444"}
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="flex items-center gap-1">
                <span className={`text-sm ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend} {card.trendText}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Invoice Volume + Value Trend
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Invoice count and total spend over 12 months.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <InvoiceTrendsChart data={trends} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Spend by Vendor (Top 10)
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Vendor spend with cumulative percentage distribution.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <TopVendorsChart data={topVendors} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Spend by Category
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Distribution of spending across different categories.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <CategorySpendChart data={categorySpend} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Cash Outflow Forecast
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Expected payment obligations grouped by due date ranges.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <CashOutflowChart />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Invoices by Vendor
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Top vendors by invoice count and net value.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <InvoicesTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
