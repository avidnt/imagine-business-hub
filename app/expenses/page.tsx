"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Expense } from "@/lib/data-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  SlideOver, Field, inputClass, selectClass,
  btnPrimary, btnSecondary,
} from "@/components/ui/slide-over";

const CATEGORIES = [
  "Salaries", "Software", "Rent", "Freelancers", "Printing",
  "Travel", "Equipment", "Ad Spend", "Production", "Utilities", "Other",
];

const emptyForm = (): Partial<Expense> => ({
  date: new Date().toISOString().slice(0, 10), category: "Other",
  amount: 0, type: "Variable", projectId: "", vendor: "",
  notes: "", paymentStatus: "Pending",
});

export default function ExpensesPage() {
  const {
    expenses, addExpense, updateExpense, deleteExpense,
    projects, getProjectName,
  } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Expense>>(emptyForm());

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.category.toLowerCase().includes(q) ||
      e.vendor.toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q);
    const matchType = typeFilter === "All" || e.type === typeFilter;
    const matchCat = categoryFilter === "All" || e.category === categoryFilter;
    return matchSearch && matchType && matchCat;
  });

  const openNew = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (e: Expense) => {
    setForm({
      date: e.date, category: e.category, amount: e.amount, type: e.type,
      projectId: e.projectId, vendor: e.vendor, notes: e.notes,
      paymentStatus: e.paymentStatus,
    });
    setEditId(e.id); setShowForm(true);
  };
  const handleSave = () => {
    if (!form.category || !form.amount) return;
    if (editId) updateExpense(editId, form);
    else addExpense(form);
    setShowForm(false);
  };
  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  // Summary stats
  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);
  const fixedTotal = expenses.filter((e) => e.type === "Fixed").reduce((s, e) => s + e.amount, 0);
  const variableTotal = expenses.filter((e) => e.type === "Variable").reduce((s, e) => s + e.amount, 0);
  const projectTotal = expenses.filter((e) => e.type === "Project").reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const catBreakdown = CATEGORIES.map((cat) => ({
    category: cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const typeColors: Record<string, string> = {
    Fixed: "bg-violet-400/15 text-violet-400",
    Variable: "bg-sky-400/15 text-sky-400",
    Project: "bg-amber-400/15 text-amber-400",
  };

  const paymentColors: Record<string, string> = {
    Paid: "bg-emerald-400/15 text-emerald-400",
    Pending: "bg-amber-400/15 text-amber-400",
    Overdue: "bg-rose-400/15 text-rose-400",
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Finance</p>
          <h2 className="mt-2 text-3xl font-semibold">Expenses</h2>
          <p className="mt-2 text-sm text-stone-400">{expenses.length} entries this month</p>
        </div>
        <button onClick={openNew} className={btnPrimary}>+ Add Expense</button>
      </div>

      {/* Summary row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4">
          <p className="text-sm text-stone-500">Total Expenses</p>
          <p className="mt-1 text-2xl font-bold text-stone-100">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="text-sm text-stone-500">Fixed</p>
          <p className="mt-1 text-2xl font-bold text-violet-400">{formatCurrency(fixedTotal)}</p>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-sm text-stone-500">Variable</p>
          <p className="mt-1 text-2xl font-bold text-sky-400">{formatCurrency(variableTotal)}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-stone-500">Project-Specific</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{formatCurrency(projectTotal)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        {/* Main table */}
        <div>
          <div className="mb-4 flex flex-wrap gap-3">
            <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} max-w-sm`} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${selectClass} max-w-[140px]`}>
              <option value="All">All Types</option>
              {["Fixed", "Variable", "Project"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${selectClass} max-w-[160px]`}>
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-800 text-left text-stone-500">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Vendor</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-stone-800/50 transition hover:bg-stone-800/30">
                    <td className="p-4 text-stone-400">{formatDate(e.date)}</td>
                    <td className="p-4 font-medium">{e.category}</td>
                    <td className="p-4 text-stone-400">{e.vendor}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColors[e.type] ?? ""}`}>{e.type}</span>
                    </td>
                    <td className="p-4 font-semibold">{formatCurrency(e.amount)}</td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentColors[e.paymentStatus] ?? ""}`}>{e.paymentStatus}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(e)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">Edit</button>
                        <button onClick={() => { if (confirm("Delete?")) deleteExpense(e.id); }} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="py-12 text-center text-stone-500">No expenses found</div>}
          </div>
        </div>

        {/* Category breakdown sidebar */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-stone-500">By Category</h3>
          <div className="space-y-3">
            {catBreakdown.map((cat) => {
              const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0;
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-300">{cat.category}</span>
                    <span className="font-medium">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-stone-800">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Expense" : "Add Expense"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date"><input className={inputClass} type="date" value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} /></Field>
            <Field label="Amount (₹)"><input className={inputClass} type="number" value={form.amount ?? 0} onChange={(e) => set("amount", Number(e.target.value))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select className={selectClass} value={form.category ?? "Other"} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Expense Type">
              <select className={selectClass} value={form.type ?? "Variable"} onChange={(e) => set("type", e.target.value)}>
                {["Fixed", "Variable", "Project"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          {form.type === "Project" && (
            <Field label="Linked Project">
              <select className={selectClass} value={form.projectId ?? ""} onChange={(e) => set("projectId", e.target.value)}>
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Vendor"><input className={inputClass} value={form.vendor ?? ""} onChange={(e) => set("vendor", e.target.value)} placeholder="e.g. Adobe, Freelancer name" /></Field>
          <Field label="Payment Status">
            <select className={selectClass} value={form.paymentStatus ?? "Pending"} onChange={(e) => set("paymentStatus", e.target.value)}>
              {["Paid", "Pending", "Overdue"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea className={`${inputClass} min-h-[80px]`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update" : "Add Expense"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
