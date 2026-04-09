"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-context";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default function InvoicesPage() {
  const { invoices, clients, getClientName } = useData();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Summary logic
  const paidInvoices = invoices.filter((i) => i.status === "Paid");
  const pendingInvoices = invoices.filter((i) => i.status === "Sent" || i.status === "Draft");
  const overdueInvoices = invoices.filter((i) => i.status === "Overdue");

  const totalRevenue = paidInvoices.reduce((acc, i) => acc + i.total, 0);
  const pendingAmount = pendingInvoices.reduce((acc, i) => acc + i.total, 0);
  const overdueAmount = overdueInvoices.reduce((acc, i) => acc + i.total, 0);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (statusFilter !== "All" && inv.status !== statusFilter) return false;
        const clientName = getClientName(inv.clientId).toLowerCase();
        const num = inv.invoiceNumber.toLowerCase();
        const sq = search.toLowerCase();
        return clientName.includes(sq) || num.includes(sq);
      })
      .sort((a, b) => new Date(b.issueDate || b.createdAt).getTime() - new Date(a.issueDate || a.createdAt).getTime());
  }, [invoices, search, statusFilter, getClientName]);

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      label: "Pending Amount",
      value: formatCurrency(pendingAmount),
      icon: <Clock className="h-5 w-5 text-sky-400" />,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
    },
    {
      label: "Overdue Amount",
      value: formatCurrency(overdueAmount),
      icon: <AlertCircle className="h-5 w-5 text-rose-400" />,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Total Invoices",
      value: invoices.length,
      icon: <FileText className="h-5 w-5 text-amber-400" />,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
            Financials
          </p>
          <h2 className="mt-2 text-3xl font-semibold">Invoices</h2>
          <p className="mt-2 text-sm text-stone-400">
            Manage billing, track payments, and generate PDFs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-500"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 rounded-2xl border border-stone-800 bg-stone-900 p-5 transition hover:border-stone-700`}
          >
            <div className={`rounded-xl p-3 ${s.bg} ${s.border} border`}>
              {s.icon}
            </div>
            <div>
              <p className="text-sm text-stone-400">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            placeholder="Search by client or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-stone-800 bg-stone-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-stone-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-stone-800 bg-stone-900 py-2.5 pl-4 pr-10 text-sm focus:border-amber-400 focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-950/50 text-left text-stone-500">
                <th className="p-4 font-medium">Invoice Number</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Issue Date</th>
                <th className="p-4 font-medium">Due Date</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-stone-800/50 transition hover:bg-stone-800/40"
                  >
                    <td className="p-4 font-medium">{inv.invoiceNumber || "—"}</td>
                    <td className="p-4 text-stone-300">
                      {getClientName(inv.clientId)}
                    </td>
                    <td className="p-4 text-stone-400">
                      {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="p-4 text-stone-400">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="p-4 font-semibold">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          inv.status === "Paid"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : inv.status === "Sent"
                            ? "bg-sky-400/10 text-sky-400"
                            : inv.status === "Overdue"
                            ? "bg-rose-400/10 text-rose-400"
                            : "bg-stone-700/50 text-stone-300"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                        className="font-medium text-amber-400 hover:text-amber-300 transition"
                      >
                        View &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-500">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
