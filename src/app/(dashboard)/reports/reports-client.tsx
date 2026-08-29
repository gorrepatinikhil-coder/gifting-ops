"use client";

import { useState } from "react";
import { Download, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import type { MOCK_STATS } from "@/lib/mock-data";

interface MonthlyData { month: string; revenue: number; orders: number; leads: number }
interface TopClient { name: string; revenue: number }
interface StageData { name: string; value: number; color: string }
interface ConversionData { name: string; value: number; color: string }

interface ReportsClientProps {
  monthlyData: MonthlyData[];
  topClients: TopClient[];
  orderStages: StageData[];
  conversionData: ConversionData[];
  stats: typeof MOCK_STATS;
}

type Period = "week" | "month" | "quarter";

function exportCSV(data: object[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => (row as Record<string, unknown>)[h]).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  color: "hsl(var(--popover-foreground))",
};

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
];

// Sortable table for top clients
function SortableClientsTable({ clients }: { clients: TopClient[] }) {
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const sorted = [...clients].sort((a, b) =>
    sortDir === "desc" ? b.revenue - a.revenue : a.revenue - b.revenue
  );
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Client</th>
            <th
              className="text-right px-4 py-2.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground"
              onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
            >
              Revenue {sortDir === "desc" ? "↓" : "↑"}
            </th>
            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Share</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, idx) => {
            const total = clients.reduce((s, x) => s + x.revenue, 0);
            const pct = total > 0 ? ((c.revenue / total) * 100).toFixed(1) : "0";
            return (
              <tr key={c.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2.5 text-muted-foreground">{idx + 1}</td>
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(c.revenue)}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground hidden md:table-cell">{pct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ReportsClient({ monthlyData, topClients, orderStages, conversionData, stats }: ReportsClientProps) {
  const [activeTab, setActiveTab] = useState("revenue");
  const [period, setPeriod] = useState<Period>("quarter");

  const totalRevenue = monthlyData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = monthlyData.reduce((s, d) => s + d.orders, 0);
  const totalLeads = monthlyData.reduce((s, d) => s + d.leads, 0);
  const wonLeads = conversionData.find((d) => d.name === "Won")?.value ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statCards = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      sub: "6-month period",
      color: "text-emerald-600",
      trend: "+41.5% MoM",
      trendUp: true,
    },
    {
      label: "Total Orders",
      value: totalOrders.toString(),
      sub: "across all clients",
      color: "text-blue-600",
      trend: null,
      trendUp: true,
    },
    {
      label: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      sub: "industry avg 15–25%",
      color: "text-orange-600",
      trend: null,
      trendUp: true,
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(avgOrderValue),
      sub: "per confirmed order",
      color: "text-violet-600",
      trend: null,
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reports & MIS</h2>
          <p className="text-sm text-muted-foreground">Gifting operations analytics · Dec '25 – May '26</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period toggle pills */}
          <div className="flex items-center gap-1 rounded-lg border p-0.5 bg-muted/40">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  period === p.key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(monthlyData, "gifting-ops-revenue.csv")}
          >
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
        </div>
      </div>

      {/* Stat cards — always above charts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, sub, color, trend, trendUp }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-muted-foreground">{sub}</p>
                {trend && (
                  <span className={cn(
                    "text-[10px] font-semibold flex items-center gap-0.5",
                    trendUp ? "text-emerald-600" : "text-red-500"
                  )}>
                    {trendUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {trend}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="revenue" className="text-xs">Monthly Revenue</TabsTrigger>
          <TabsTrigger value="clients" className="text-xs">Top Clients</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs">Order Pipeline</TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs">Lead Conversion</TabsTrigger>
        </TabsList>

        {/* Monthly Revenue */}
        <TabsContent value="revenue" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Monthly Revenue & Orders</CardTitle>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />↑ 41.5% MoM
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/50" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "Month", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    width={52}
                    label={{ value: "Revenue (₹)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      name === "revenue" ? formatCurrency(v) : v,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: "#f97316" }}
                    name="revenue"
                  />
                  <Bar dataKey="orders" fill="#3b82f6" opacity={0.5} radius={[2, 2, 0, 0]} name="orders" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Clients */}
        <TabsContent value="clients" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={topClients}
                  layout="vertical"
                  margin={{ top: 4, right: 20, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/50" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                    label={{ value: "Revenue (₹)", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={160}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Sortable data table below the chart */}
              <SortableClientsTable clients={topClients} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Pipeline */}
        <TabsContent value="pipeline" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Orders by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={orderStages}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {orderStages.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v} orders`, name]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Stage Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {orderStages.map((stage) => {
                  const total = orderStages.reduce((s, d) => s + d.value, 0);
                  return (
                    <div key={stage.name} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{stage.name}</span>
                          <span className="text-muted-foreground">{stage.value} orders · {total > 0 ? ((stage.value / total) * 100).toFixed(0) : 0}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${total > 0 ? (stage.value / total) * 100 : 0}%`,
                              backgroundColor: stage.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lead Conversion */}
        <TabsContent value="conversion" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Lead Conversion Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {conversionData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v} leads`, name]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {[
                  { label: "Total Leads (6 mo)", value: totalLeads, sub: "across all sales reps" },
                  { label: "Leads Won", value: wonLeads, sub: "converted to orders" },
                  { label: "Conversion Rate", value: `${stats.conversionRate}%`, sub: "industry avg: 15–25%" },
                  { label: "Avg Order Value", value: formatCurrency(stats.monthlyRevenue / stats.totalOrders), sub: "this month" },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                    <p className="text-base font-bold text-primary">{value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
