"use client";

import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-context";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function WorkingCapitalPage() {
  const { invoices, expenses, projects, getClientName } = useData();

  // ── Calculations ───────────────────────────────
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = invoices
    .filter((i) => i.status === "Paid")
    .reduce((s, i) => s + i.total, 0);
  const totalPending = invoices
    .filter((i) => i.status === "Sent" || i.status === "Overdue")
    .reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices
    .filter((i) => i.status === "Overdue")
    .reduce((s, i) => s + i.total, 0);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const paidExpenses = expenses
    .filter((e) => e.paymentStatus === "Paid")
    .reduce((s, e) => s + e.amount, 0);
  const pendingExpenses = expenses
    .filter((e) => e.paymentStatus === "Pending" || e.paymentStatus === "Overdue")
    .reduce((s, e) => s + e.amount, 0);

  const netPosition = totalCollected - paidExpenses;
  const activeBilling = projects
    .filter((p) => p.status !== "Completed")
    .reduce((s, p) => s + p.billingValue, 0);

  // Monthly burn (fixed expenses)
  const monthlyBurn = expenses
    .filter((e) => e.type === "Fixed")
    .reduce((s, e) => s + e.amount, 0);
  const runway = monthlyBurn > 0 ? Math.round((netPosition / monthlyBurn) * 10) / 10 : 0;

  // ── Chart data ─────────────────────────────────
  const cashFlowData = [
    { name: "Invoiced", inflow: totalInvoiced, outflow: 0 },
    { name: "Collected", inflow: totalCollected, outflow: 0 },
    { name: "Expenses", inflow: 0, outflow: totalExpenses },
    { name: "Net", inflow: Math.max(netPosition, 0), outflow: Math.max(-netPosition, 0) },
  ];

  const receivablesData = invoices
    .filter((i) => i.status === "Sent" || i.status === "Overdue")
    .map((i) => ({
      name: getClientName(i.clientId),
      value: i.total,
    }));

  const expenseTypeData = [
    { name: "Fixed", value: expenses.filter((e) => e.type === "Fixed").reduce((s, e) => s + e.amount, 0) },
    { name: "Variable", value: expenses.filter((e) => e.type === "Variable").reduce((s, e) => s + e.amount, 0) },
    { name: "Project", value: expenses.filter((e) => e.type === "Project").reduce((s, e) => s + e.amount, 0) },
  ].filter((d) => d.value > 0);

  const healthStatus = netPosition > monthlyBurn * 2
    ? { label: "Healthy", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" }
    : netPosition > 0
      ? { label: "Moderate", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" }
      : { label: "Critical", color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10" };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Finance</p>
          <h2 className="mt-2 text-3xl font-semibold">Working Capital</h2>
          <p className="mt-2 text-sm text-stone-400">Cash position, receivables, and business health</p>
        </div>
        <div className={`rounded-2xl border ${healthStatus.border} ${healthStatus.bg} px-5 py-3`}>
          <p className="text-xs text-stone-500">Cash Health</p>
          <p className={`text-lg font-bold ${healthStatus.color}`}>{healthStatus.label}</p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Net Position", value: formatCurrency(netPosition), sub: "Collections − Paid expenses", color: netPosition >= 0 ? "text-emerald-400" : "text-rose-400", border: "border-stone-800", bg: "bg-stone-900" },
          { label: "Receivables", value: formatCurrency(totalPending), sub: `${invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").length} pending invoices`, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5" },
          { label: "Payables", value: formatCurrency(pendingExpenses), sub: `${expenses.filter((e) => e.paymentStatus !== "Paid").length} unpaid expenses`, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/5" },
          { label: "Monthly Burn", value: formatCurrency(monthlyBurn), sub: `~${runway} months runway`, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/5" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`rounded-2xl border ${s.border} ${s.bg} p-5 animate-[slideUp_0.35s_ease-out]`}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <p className="text-sm text-stone-500">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs text-stone-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Cash flow bar chart */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-1 text-lg font-semibold">Cash Flow Summary</h3>
          <p className="mb-6 text-sm text-stone-500">Inflows vs outflows</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                <XAxis dataKey="name" stroke="#78716c" fontSize={12} />
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
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="inflow" fill="#10b981" radius={[6, 6, 0, 0]} name="Inflow" />
                <Bar dataKey="outflow" fill="#ef4444" radius={[6, 6, 0, 0]} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense breakdown pie */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-1 text-lg font-semibold">Expense Breakdown</h3>
          <p className="mb-4 text-sm text-stone-500">By type</p>
          <div className="flex items-center justify-center">
            <div className="h-52 w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseTypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {expenseTypeData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-stone-300">{d.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom sections */}
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {/* Receivables */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-1 text-lg font-semibold">Outstanding Receivables</h3>
          <p className="mb-4 text-sm text-stone-500">Pending payments from clients</p>
          {receivablesData.length > 0 ? (
            <div className="space-y-3">
              {invoices
                .filter((i) => i.status === "Sent" || i.status === "Overdue")
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-950/60 p-4"
                  >
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-sm text-stone-500">{getClientName(inv.clientId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-400">{formatCurrency(inv.total)}</p>
                      <span
                        className={`text-xs font-semibold ${
                          inv.status === "Overdue" ? "text-rose-400" : "text-sky-400"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-stone-500">
              No pending receivables 🎉
            </p>
          )}
        </div>

        {/* Financial summary */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
          <h3 className="mb-1 text-lg font-semibold">Financial Summary</h3>
          <p className="mb-4 text-sm text-stone-500">Key numbers at a glance</p>
          <div className="space-y-4">
            {[
              { label: "Active Project Billing", value: formatCurrency(activeBilling), desc: `${projects.filter((p) => p.status !== "Completed").length} active projects` },
              { label: "Total Invoiced", value: formatCurrency(totalInvoiced), desc: `${invoices.length} invoices generated` },
              { label: "Total Collected", value: formatCurrency(totalCollected), desc: `${invoices.filter((i) => i.status === "Paid").length} invoices paid` },
              { label: "Total Overdue", value: formatCurrency(totalOverdue), desc: `${invoices.filter((i) => i.status === "Overdue").length} overdue invoices` },
              { label: "Total Expenses", value: formatCurrency(totalExpenses), desc: `${expenses.length} expense entries` },
              { label: "Gross Margin", value: formatCurrency(totalCollected - paidExpenses), desc: "Collections minus paid expenses" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-xl border border-stone-800/60 bg-stone-950/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-stone-300">{row.label}</p>
                  <p className="text-xs text-stone-500">{row.desc}</p>
                </div>
                <p className="text-lg font-semibold">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
