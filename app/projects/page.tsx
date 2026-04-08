"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Project } from "@/lib/data-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  SlideOver, Field, inputClass, selectClass,
  btnPrimary, btnSecondary, btnDanger,
} from "@/components/ui/slide-over";

const emptyForm = (): Partial<Project> => ({
  name: "", clientId: "", type: "Monthly", startDate: "", endDate: "",
  owner: "", status: "Planning", billingValue: 0, proposalId: "", notes: "",
});

export default function ProjectsPage() {
  const {
    projects, addProject, updateProject, deleteProject,
    clients, deliverables, getClientName,
  } = useData();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Project>>(emptyForm());

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || getClientName(p.clientId).toLowerCase().includes(q);
    const matchType = typeFilter === "All" || p.type === typeFilter;
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const openNew = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (p: Project) => {
    setForm({ name: p.name, clientId: p.clientId, type: p.type, startDate: p.startDate, endDate: p.endDate, owner: p.owner, status: p.status, billingValue: p.billingValue, proposalId: p.proposalId, notes: p.notes });
    setEditId(p.id); setShowForm(true);
  };
  const handleSave = () => {
    if (!form.name || !form.clientId) return;
    if (editId) updateProject(editId, form);
    else addProject(form);
    setShowForm(false);
  };
  const set = (k: string, v: string | number) => setForm((prev) => ({ ...prev, [k]: v }));

  const statusColors: Record<string, string> = {
    "Planning": "bg-stone-700 text-stone-300",
    "In Progress": "bg-amber-400/15 text-amber-400",
    "Review": "bg-sky-400/15 text-sky-400",
    "Completed": "bg-emerald-400/15 text-emerald-400",
    "On Hold": "bg-rose-400/15 text-rose-400",
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Work</p>
          <h2 className="mt-2 text-3xl font-semibold">Projects</h2>
          <p className="mt-2 text-sm text-stone-400">
            {projects.length} projects · {projects.filter((p) => p.type === "Monthly").length} monthly, {projects.filter((p) => p.type === "One-Time").length} one-time
          </p>
        </div>
        <button onClick={openNew} className={btnPrimary}>+ New Project</button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} max-w-sm`} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${selectClass} max-w-[160px]`}>
          <option value="All">All Types</option>
          <option value="Monthly">Monthly</option>
          <option value="One-Time">One-Time</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectClass} max-w-[160px]`}>
          <option value="All">All Status</option>
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="Review">Review</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Project cards */}
      <div className="space-y-4">
        {filtered.map((p, i) => {
          const projDelivs = deliverables.filter((d) => d.projectId === p.id);
          const totalPlanned = projDelivs.reduce((s, d) => s + d.quantityPlanned, 0);
          const totalDone = projDelivs.reduce((s, d) => s + d.quantityCompleted, 0);
          const pct = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;

          return (
            <div
              key={p.id}
              className="group rounded-2xl border border-stone-800 bg-stone-900 p-5 transition-all hover:border-stone-700 hover:shadow-lg animate-[slideUp_0.3s_ease-out]"
              style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.type === "Monthly" ? "bg-violet-400/15 text-violet-400" : "bg-cyan-400/15 text-cyan-400"}`}>
                      {p.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-400">
                    {getClientName(p.clientId)} · Owner: {p.owner || "—"}
                    {p.startDate && ` · Started ${formatDate(p.startDate)}`}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold">{formatCurrency(p.billingValue)}</p>
                    <p className="text-xs text-stone-500">{p.type === "Monthly" ? "/month" : "project"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[p.status] ?? ""}`}>
                    {p.status}
                  </span>
                </div>
              </div>

              {projDelivs.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-stone-800">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-stone-500">{totalDone}/{totalPlanned} deliverables ({pct}%)</span>
                  </div>
                </div>
              )}

              {p.notes && <p className="mt-3 text-sm text-stone-500 line-clamp-1">{p.notes}</p>}

              <div className="mt-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => openEdit(p)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">Edit</button>
                <button onClick={() => { if (confirm("Delete?")) deleteProject(p.id); }} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20">Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg text-stone-500">No projects found</p>
          <button onClick={openNew} className={`${btnPrimary} mt-4`}>Create your first project</button>
        </div>
      )}

      {/* Form */}
      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Project" : "New Project"}>
        <div className="space-y-4">
          <Field label="Project Name"><input className={inputClass} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Monthly Retainer" /></Field>
          <Field label="Client">
            <select className={selectClass} value={form.clientId ?? ""} onChange={(e) => set("clientId", e.target.value)}>
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project Type">
              <select className={selectClass} value={form.type ?? "Monthly"} onChange={(e) => set("type", e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="One-Time">One-Time</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={selectClass} value={form.status ?? "Planning"} onChange={(e) => set("status", e.target.value)}>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date"><input className={inputClass} type="date" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="End Date"><input className={inputClass} type="date" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Billing Value (₹)"><input className={inputClass} type="number" value={form.billingValue ?? 0} onChange={(e) => set("billingValue", Number(e.target.value))} /></Field>
            <Field label="Owner"><input className={inputClass} value={form.owner ?? ""} onChange={(e) => set("owner", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className={`${inputClass} min-h-[80px]`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update" : "Create Project"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
