"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-context";
import { formatCurrency } from "@/lib/utils";
import { Calendar, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const PIE_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6"];

export default function Dashboard() {
  const { clients, projects, invoices, expenses, tasks, deliverables, getClientName } = useData();

  // Date Filter State
  const [dateFilter, setDateFilter] = useState("This Month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const currentRange = useMemo(() => {
    if (dateFilter === "Custom" && customStart && customEnd) {
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    
    const now = new Date();
    if (dateFilter === "Today") {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (dateFilter === "This Week") {
      const start = new Date(now);
      const day = start.getDay() || 7;
      if (day !== 1) start.setHours(-24 * (day - 1), 0, 0, 0);
      else start.setHours(0, 0, 0, 0);
      const end = new Date(start); 
      end.setDate(end.getDate() + 6); 
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (dateFilter === "This Year") {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    // Default: This Month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }, [dateFilter, customStart, customEnd]);

  const prevRange = useMemo(() => {
    const diff = currentRange.end.getTime() - currentRange.start.getTime();
    const end = new Date(currentRange.start.getTime() - 1);
    const start = new Date(end.getTime() - diff);
    return { start, end };
  }, [currentRange]);

  const isWithinRange = (dateStr: string, range: {start: Date, end: Date}) => {
    const d = new Date(dateStr);
    return d >= range.start && d <= range.end;
  };

  // Filter Data
  const filteredInvoices = invoices.filter(i => i.issueDate && isWithinRange(i.issueDate, currentRange));
  const prevInvoices = invoices.filter(i => i.issueDate && isWithinRange(i.issueDate, prevRange));

  const filteredExpenses = expenses.filter(e => e.date && isWithinRange(e.date, currentRange));
  const prevExpenses = expenses.filter(e => e.date && isWithinRange(e.date, prevRange));

  // Compute Metrics
  const calculateMetrics = (invList: typeof invoices, expList: typeof expenses) => {
    const paid = invList.filter(i => i.status === "Paid");
    const revenue = paid.reduce((s, i) => s + i.total, 0);
    const totalExp = expList.reduce((s, e) => s + e.amount, 0);
    const netProfit = revenue - totalExp;
    
    const pending = invList.filter(i => i.status === "Sent" || i.status === "Overdue");
    const pendingAmount = pending.reduce((s, i) => s + i.total, 0);
    const overdue = invList.filter(i => i.status === "Overdue");
    const overdueAmount = overdue.reduce((s, i) => s + i.total, 0);

    return { revenue, totalExp, netProfit, pendingAmount, overdueAmount };
  };

  const currentMetrics = calculateMetrics(filteredInvoices, filteredExpenses);
  const prevMetrics = calculateMetrics(prevInvoices, prevExpenses);

  const getGrowth = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const growth = {
    revenue: getGrowth(currentMetrics.revenue, prevMetrics.revenue),
    totalExp: getGrowth(currentMetrics.totalExp, prevMetrics.totalExp),
    netProfit: getGrowth(currentMetrics.netProfit, prevMetrics.netProfit),
    pendingAmount: getGrowth(currentMetrics.pendingAmount, prevMetrics.pendingAmount),
    overdueAmount: getGrowth(currentMetrics.overdueAmount, prevMetrics.overdueAmount),
  };

  // Alerts Logic
  const alerts = [];
  if (growth.totalExp > 5) {
    alerts.push({
      id: "high-expenses",
      type: "warning",
      icon: TrendingUp,
      title: "Rising Expenses",
      message: `Expenses are up by ${growth.totalExp.toFixed(1)}% compared to the previous period.`
    });
  }
  if (growth.revenue < -5) {
    alerts.push({
      id: "drop-revenue",
      type: "danger",
      icon: TrendingDown,
      title: "Revenue Drop Detected",
      message: `Revenue has decreased by ${Math.abs(growth.revenue).toFixed(1)}% compared to the previous period.`
    });
  }
  if (currentMetrics.pendingAmount > 0 && currentMetrics.revenue > 0 && currentMetrics.pendingAmount > (currentMetrics.revenue * 0.25)) {
    alerts.push({
      id: "high-pending",
      type: "info",
      icon: AlertCircle,
      title: "High Pending Payments",
      message: `You have ${formatCurrency(currentMetrics.pendingAmount)} tied up in pending invoices.`
    });
  } else if (currentMetrics.pendingAmount > 50000) {
    alerts.push({
      id: "high-pending",
      type: "info",
      icon: AlertCircle,
      title: "High Pending Payments",
      message: `You have ${formatCurrency(currentMetrics.pendingAmount)} tied up in pending invoices.`
    });
  }

  // Render Helpers
  const renderGrowth = (val: number, inverse: boolean = false) => {
    if (val === 0) return <span className="text-xs ml-2 text-stone-500">—</span>;
    const isPos = val > 0;
    const isGood = inverse ? !isPos : isPos;
    const color = isGood ? "text-emerald-400" : "text-rose-400";
    return (
      <span className={`text-xs ml-2 font-medium ${color}`}>
        {isPos ? "↑" : "↓"} {Math.abs(val).toFixed(1)}%
      </span>
    );
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(currentMetrics.revenue),
      sub: `${filteredInvoices.filter(i => i.status === "Paid").length} invoices paid`,
      growth: growth.revenue,
      inverseGrowth: false,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(currentMetrics.totalExp),
      sub: `${filteredExpenses.length} entries`,
      growth: growth.totalExp,
      inverseGrowth: true,
      color: "text-rose-400",
      border: "border-rose-500/20",
      bg: "bg-rose-500/5",
    },
    {
      label: "Net Profit",
      value: formatCurrency(currentMetrics.netProfit),
      sub: "Revenue - Expenses",
      growth: growth.netProfit,
      inverseGrowth: false,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
    {
      label: "Pending Amount",
      value: formatCurrency(currentMetrics.pendingAmount),
      sub: `${filteredInvoices.filter(i => i.status === "Sent" || i.status === "Overdue").length} invoices pending`,
      growth: growth.pendingAmount,
      inverseGrowth: true,
      color: "text-sky-400",
      border: "border-sky-500/20",
      bg: "bg-sky-500/5",
    },
    {
      label: "Overdue Amount",
      value: formatCurrency(currentMetrics.overdueAmount),
      sub: `${filteredInvoices.filter(i => i.status === "Overdue").length} overdue`,
      growth: growth.overdueAmount,
      inverseGrowth: true,
      color: "text-purple-400",
      border: "border-purple-500/20",
      bg: "bg-purple-500/5",
    },
  ];

  /* ───── CHARTS DATA ───── */
  
  // 1. Area Chart (Daily/Monthly relative to current filter)
  const generateAreaChartData = () => {
    const diffDays = (currentRange.end.getTime() - currentRange.start.getTime()) / (1000 * 3600 * 24);
    const dataMap = new Map<string, { revenue: number, expenses: number, label: string }>();

    const getKey = (d: Date) => {
      if (diffDays > 90) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const getLabel = (d: Date) => {
      if (diffDays > 90) return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const current = new Date(currentRange.start);
    while (current <= currentRange.end) {
      const key = getKey(current);
      if (!dataMap.has(key)) {
        dataMap.set(key, { revenue: 0, expenses: 0, label: getLabel(current) });
      }
      current.setDate(current.getDate() + 1);
    }

    filteredInvoices.filter(i => i.status === "Paid").forEach(i => {
      if (!i.issueDate) return;
      const d = new Date(i.issueDate);
      const key = getKey(d);
      if (dataMap.has(key)) dataMap.get(key)!.revenue += i.total;
    });

    filteredExpenses.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      const key = getKey(d);
      if (dataMap.has(key)) dataMap.get(key)!.expenses += e.amount;
    });

    return Array.from(dataMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  };
  const areaChartData = generateAreaChartData();

  // 2. Monthly Trend (Trailing 6 months universally applicable to give perspective)
  const generateMonthlyTrendData = () => {
    const dataMap = new Map<string, { revenue: number, expenses: number, label: string }>();
    const getKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const getLabel = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });

    const endMonth = new Date(currentRange.end.getFullYear(), currentRange.end.getMonth(), 1);
    const current = new Date(endMonth);
    current.setMonth(current.getMonth() - 5); // 6 months total
    
    const rangeStart = new Date(current);
    const rangeEnd = new Date(currentRange.end.getFullYear(), currentRange.end.getMonth() + 1, 0, 23, 59, 59, 999);

    while (current <= endMonth) {
      const key = getKey(current);
      if (!dataMap.has(key)) {
        dataMap.set(key, { revenue: 0, expenses: 0, label: getLabel(current) });
      }
      current.setMonth(current.getMonth() + 1);
    }

    invoices.filter(i => i.status === "Paid").forEach(i => {
      if (!i.issueDate) return;
      const d = new Date(i.issueDate);
      if (d >= rangeStart && d <= rangeEnd) {
        const key = getKey(d);
        if (dataMap.has(key)) dataMap.get(key)!.revenue += i.total;
      }
    });

    expenses.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      if (d >= rangeStart && d <= rangeEnd) {
        const key = getKey(d);
        if (dataMap.has(key)) dataMap.get(key)!.expenses += e.amount;
      }
    });

    return Array.from(dataMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  };
  const monthlyTrendData = generateMonthlyTrendData();

  // 3. Breakdown - Expenses by Category
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const cat = e.category || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + e.amount);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredExpenses]);

  // 4. Breakdown - Revenue by Client
  const revenueByClient = useMemo(() => {
    const map = new Map<string, number>();
    filteredInvoices.filter(i => i.status === "Paid").forEach(i => {
      map.set(i.clientId, (map.get(i.clientId) || 0) + i.total);
    });
    return Array.from(map.entries())
      .map(([clientId, value]) => ({ name: getClientName(clientId), value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [filteredInvoices, getClientName]);

  
  // Other Dashboard Logic
  const activeProjects = projects.filter((p) => p.status !== "Completed");
  const statusCounts = [
    { name: "Planning", value: projects.filter((p) => p.status === "Planning").length },
    { name: "In Progress", value: projects.filter((p) => p.status === "In Progress").length },
    { name: "Review", value: projects.filter((p) => p.status === "Review").length },
    { name: "Completed", value: projects.filter((p) => p.status === "Completed").length },
    { name: "On Hold", value: projects.filter((p) => p.status === "On Hold").length },
  ].filter((s) => s.value > 0);

  const urgentTasks = tasks
    .filter((t) => t.status !== "Done")
    .sort((a, b) => {
      const pri = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      return (pri[a.priority] ?? 4) - (pri[b.priority] ?? 4);
    })
    .slice(0, 5);

  return (
    <AppShell>
      <div className="space-y-8">
        
        {/* HEADER & GLOBAL FILTER */}
        <div className="flex flex-col gap-4 border-b border-stone-800 pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
              Control Center
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Dashboard</h2>
            <p className="mt-2 text-sm text-stone-400">
              Business performance, financials, and project activity.
            </p>
          </div>
          
          <div className="flex flex-col items-start gap-3 xl:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {["Today", "This Week", "This Month", "This Year"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setDateFilter(filter);
                    setCustomStart("");
                    setCustomEnd("");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    dateFilter === filter
                      ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                      : "bg-stone-800/50 text-stone-400 hover:bg-stone-800 hover:text-stone-300"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-stone-800 bg-stone-900 px-2 py-1 transition-colors focus-within:border-stone-600">
                <Calendar className="mr-2 h-4 w-4 text-stone-500" />
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => {
                    setCustomStart(e.target.value);
                    setDateFilter("Custom");
                  }}
                  className="bg-transparent text-sm text-stone-300 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <span className="text-xs text-stone-500">to</span>
              <div className="flex items-center rounded-lg border border-stone-800 bg-stone-900 px-2 py-1 transition-colors focus-within:border-stone-600">
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => {
                    setCustomEnd(e.target.value);
                    setDateFilter("Custom");
                  }}
                  className="bg-transparent text-sm text-stone-300 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ALERTS / INSIGHTS */}
        {alerts.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 rounded-2xl border p-4 shadow-sm ${
                    alert.type === "danger"
                      ? "border-rose-500/30 bg-rose-500/10"
                      : alert.type === "warning"
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-sky-500/30 bg-sky-500/10"
                  }`}
                >
                  <div
                    className={`mt-0.5 rounded-xl p-2.5 ${
                      alert.type === "danger"
                        ? "bg-rose-500/20 text-rose-400"
                        : alert.type === "warning"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-sky-500/20 text-sky-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4
                      className={`font-semibold ${
                        alert.type === "danger"
                          ? "text-rose-400"
                          : alert.type === "warning"
                          ? "text-amber-400"
                          : "text-sky-400"
                      }`}
                    >
                      {alert.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-stone-300">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`rounded-2xl border ${s.border} ${s.bg} p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg animate-[slideUp_0.35s_ease-out]`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <p className="text-sm text-stone-400">{s.label}</p>
              <div className="mt-3 flex items-baseline">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                {renderGrowth(s.growth, s.inverseGrowth)}
              </div>
              <p className="mt-2 text-xs text-stone-500">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* MAIN CHARTS (Area & Monthly Trend Bar) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue vs Expenses (Filtered) */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-1 text-lg font-semibold">Revenue vs Expenses</h3>
            <p className="mb-6 text-sm text-stone-500">For selected period</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="label" stroke="#78716c" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#78716c"
                    fontSize={12}
                    tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#1c1917",
                      border: "1px solid #44403c",
                      borderRadius: 12,
                      color: "#f5f5f4",
                      fontSize: 13,
                    }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    fill="url(#gRev)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    fill="url(#gExp)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend (Trailing 6 months) */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-1 text-lg font-semibold">Monthly Trend</h3>
            <p className="mb-6 text-sm text-stone-500">Trailing 6 months contextual view</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="label" stroke="#78716c" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis 
                    stroke="#78716c" 
                    fontSize={12} 
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <RechartsTooltip 
                    cursor={{fill: '#292524'}} 
                    contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 12, color: "#f5f5f4", fontSize: 13 }} 
                    formatter={(value: any) => formatCurrency(Number(value))} 
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* BREAKDOWNS (Revenue by Client & Expenses by Category) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Expenses by Category */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-1 text-lg font-semibold">Expenses Breakdown</h3>
            <p className="mb-4 text-sm text-stone-500">By category (Filtered)</p>
            <div className="flex h-56 items-center justify-center">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {expensesByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ background: "#1c1917", border: "1px solid #44403c", borderRadius: 12, color: "#f5f5f4", fontSize: 13 }}
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-stone-500">No expense data for this period.</p>
              )}
            </div>
            {/* Legend */}
            {expensesByCategory.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                {expensesByCategory.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-stone-300">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue by Client */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">Revenue by Client</h3>
              <p className="text-sm text-stone-500">Top paying clients (Filtered)</p>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-5">
              {revenueByClient.map((client, i) => {
                const max = revenueByClient[0]?.value || 1;
                const pct = Math.round((client.value / max) * 100);
                return (
                  <div key={i} className="animate-[slideUp_0.35s_ease-out]" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-stone-200">{client.name}</span>
                      <span className="text-stone-400">{formatCurrency(client.value)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-stone-800 overflow-hidden">
                      <div className="h-2 rounded-full bg-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              {revenueByClient.length === 0 && <p className="text-stone-500 text-sm py-4 text-center">No revenue data for this period.</p>}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY (Invoices & Expenses) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Invoices */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-5 text-lg font-semibold">Recent Invoices</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-800 text-left text-stone-500">
                    <th className="pb-3 pr-4 font-medium">Invoice</th>
                    <th className="pb-3 pr-4 font-medium">Client</th>
                    <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                    <th className="pb-3 pl-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.slice(0, 5).map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-stone-800/50 transition hover:bg-stone-800/30"
                    >
                      <td className="py-3 pr-4 font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 pr-4 text-stone-400">
                        {getClientName(inv.clientId)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-right">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="py-3 pl-4">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            inv.status === "Paid"
                              ? "bg-emerald-400/15 text-emerald-400"
                              : inv.status === "Sent"
                                ? "bg-sky-400/15 text-sky-400"
                                : inv.status === "Overdue"
                                  ? "bg-rose-400/15 text-rose-400"
                                  : "bg-stone-700 text-stone-300"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-stone-500">
                        No invoices found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-5 text-lg font-semibold">Recent Expenses</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-800 text-left text-stone-500">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Vendor</th>
                    <th className="pb-3 pl-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-stone-800/50 transition hover:bg-stone-800/30"
                    >
                      <td className="py-3 pr-4 text-stone-400 whitespace-nowrap">
                        {exp.date ? new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                      </td>
                      <td className="py-3 pr-4 font-medium">{exp.category || "—"}</td>
                      <td className="py-3 pr-4 text-stone-400 truncate max-w-[120px]">{exp.vendor || "—"}</td>
                      <td className="py-3 pl-4 font-medium text-right text-rose-300">{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-stone-500">
                        No expenses found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* OPERATIONS (Status, Active Projects, tasks) */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Project status pie */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-1 text-lg font-semibold">Project Pipeline</h3>
            <p className="mb-4 text-sm text-stone-500">
              {projects.length} total projects
            </p>
            <div className="flex items-center justify-center">
              <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusCounts.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        background: "#1c1917",
                        border: "1px solid #44403c",
                        borderRadius: 12,
                        color: "#f5f5f4",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {statusCounts.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-stone-300">{s.name}</span>
                  </div>
                  <span className="font-medium text-stone-100">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active projects */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-5 text-lg font-semibold">Active Projects</h3>
            <div className="space-y-3">
              {activeProjects.slice(0, 4).map((project) => {
                const projDeliverables = deliverables.filter(
                  (d) => d.projectId === project.id,
                );
                const totalPlanned = projDeliverables.reduce(
                  (s, d) => s + d.quantityPlanned, 0,
                );
                const totalDone = projDeliverables.reduce(
                  (s, d) => s + d.quantityCompleted, 0,
                );
                const pct = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;
                return (
                  <div
                    key={project.id}
                    className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4 transition hover:border-stone-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{project.name}</p>
                        <p className="mt-1 text-xs text-stone-400 truncate">
                          {getClientName(project.clientId)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          project.status === "In Progress"
                            ? "bg-amber-400/15 text-amber-400"
                            : project.status === "Review"
                              ? "bg-sky-400/15 text-sky-400"
                              : project.status === "Planning"
                                ? "bg-stone-700 text-stone-300"
                                : "bg-emerald-400/15 text-emerald-400"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1 flex-1 rounded-full bg-stone-800">
                        <div
                          className="h-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-500 w-6 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
              {activeProjects.length === 0 && <p className="text-sm text-stone-500 py-4 text-center">No active projects</p>}
            </div>
          </div>

          {/* Priority tasks */}
          <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-5 text-lg font-semibold">Priority Tasks</h3>
            <div className="space-y-3">
              {urgentTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4 transition hover:border-stone-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{task.title}</p>
                      <p className="mt-1 text-xs text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        task.priority === "Urgent"
                          ? "bg-rose-500/15 text-rose-400"
                          : task.priority === "High"
                            ? "bg-amber-400/15 text-amber-400"
                            : "bg-stone-700 text-stone-300"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        task.status === "In Progress"
                          ? "bg-amber-400"
                          : task.status === "Todo"
                            ? "bg-stone-500"
                            : task.status === "Review"
                              ? "bg-sky-400"
                              : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider">{task.status}</span>
                  </div>
                </div>
              ))}
              {urgentTasks.length === 0 && (
                <p className="py-8 text-center text-sm text-stone-500">
                  No pending tasks 🎉
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
