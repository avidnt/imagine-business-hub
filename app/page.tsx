"use client";

import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-context";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const revenueData = [
  { month: "Nov", revenue: 65000, expenses: 45000 },
  { month: "Dec", revenue: 72000, expenses: 48000 },
  { month: "Jan", revenue: 80000, expenses: 52000 },
  { month: "Feb", revenue: 95000, expenses: 55000 },
  { month: "Mar", revenue: 110000, expenses: 58000 },
  { month: "Apr", revenue: 125000, expenses: 54000 },
];

const PIE_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"];

export default function Dashboard() {
  const { clients, projects, invoices, expenses, tasks, deliverables, getClientName } = useData();

  const activeProjects = projects.filter((p) => p.status !== "Completed");
  const monthlyRevenue = projects
    .filter((p) => p.status !== "Completed")
    .reduce((sum, p) => sum + p.billingValue, 0);
  const pendingInvoices = invoices.filter(
    (i) => i.status === "Sent" || i.status === "Overdue",
  );
  const pendingAmount = pendingInvoices.reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const paidInvoices = invoices.filter((i) => i.status === "Paid");
  const collectedAmount = paidInvoices.reduce((s, i) => s + i.total, 0);

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

  const stats = [
    {
      label: "Active Billing",
      value: formatCurrency(monthlyRevenue),
      sub: `${activeProjects.length} active projects`,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
    {
      label: "Collected",
      value: formatCurrency(collectedAmount),
      sub: `${paidInvoices.length} invoices paid`,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
    {
      label: "Pending Payments",
      value: formatCurrency(pendingAmount),
      sub: `${pendingInvoices.length} invoices pending`,
      color: "text-sky-400",
      border: "border-sky-500/20",
      bg: "bg-sky-500/5",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(totalExpenses),
      sub: `${expenses.length} entries this month`,
      color: "text-rose-400",
      border: "border-rose-500/20",
      bg: "bg-rose-500/5",
    },
  ];

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
            Studio Operations
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Dashboard</h2>
          <p className="mt-2 max-w-xl text-sm text-stone-400">
            Revenue, expenses, project status, and upcoming deadlines at a
            glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
            {clients.filter((c) => c.status === "Active").length} Active Clients
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`rounded-2xl border ${s.border} ${s.bg} p-5 transition-all hover:shadow-lg animate-[slideUp_0.35s_ease-out] hover:translate-y-[-2px]`}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <p className="text-sm text-stone-400">{s.label}</p>
            <p className={`mt-3 text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-2 text-xs text-stone-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Revenue chart */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-1 text-lg font-semibold">Revenue vs Expenses</h3>
          <p className="mb-6 text-sm text-stone-500">Last 6 months</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="month" stroke="#78716c" fontSize={12} />
                <YAxis
                  stroke="#78716c"
                  fontSize={12}
                  tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
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
                  stroke="#f59e0b"
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

        {/* Project status pie */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-1 text-lg font-semibold">Project Status</h3>
          <p className="mb-4 text-sm text-stone-500">
            {projects.length} total projects
          </p>
          <div className="flex items-center justify-center">
            <div className="h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusCounts.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
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
          <div className="mt-4 space-y-2">
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
      </div>

      {/* Bottom row */}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Active projects */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-5 text-lg font-semibold">Active Projects</h3>
          <div className="space-y-3">
            {activeProjects.slice(0, 5).map((project) => {
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
                      <p className="font-medium">{project.name}</p>
                      <p className="mt-1 text-sm text-stone-400">
                        {getClientName(project.clientId)} · {project.type}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
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
                    <div className="h-1.5 flex-1 rounded-full bg-stone-800">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-500">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgent tasks */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-5 text-lg font-semibold">Priority Tasks</h3>
          <div className="space-y-3">
            {urgentTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4 transition hover:border-stone-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {task.assignee} · Due{" "}
                      {new Date(task.dueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
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
                    className={`h-2 w-2 rounded-full ${
                      task.status === "In Progress"
                        ? "bg-amber-400"
                        : task.status === "Todo"
                          ? "bg-stone-500"
                          : task.status === "Review"
                            ? "bg-sky-400"
                            : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-xs text-stone-500">{task.status}</span>
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

      {/* Recent invoices */}
      <div className="mt-8 rounded-3xl border border-stone-800 bg-stone-900 p-6">
        <h3 className="mb-5 text-lg font-semibold">Recent Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800 text-left text-stone-500">
                <th className="pb-3 pr-4 font-medium">Invoice</th>
                <th className="pb-3 pr-4 font-medium">Client</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((inv) => (
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
                  <td className="py-3 pr-4 font-medium">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
