"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Deliverable } from "@/lib/data-context";
import {
  SlideOver, Field, inputClass, selectClass,
  btnPrimary, btnSecondary,
} from "@/components/ui/slide-over";

const emptyForm = (): Partial<Deliverable> => ({
  projectId: "",
  serviceName: "",
  totalQuantity: 0,
  completedQuantity: 0,
  type: "One-Time",
  status: "Planned",
  notes: "",
});

export default function DeliverablesPage() {
  const { deliverables, addDeliverable, updateDeliverable, deleteDeliverable, projects, getProjectName, getClientName } = useData();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Deliverable>>(emptyForm());

  const filtered = deliverables.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      (d.serviceName || "").toLowerCase().includes(q) ||
      getProjectName(d.projectId).toLowerCase().includes(q);
    const matchProject = projectFilter === "All" || d.projectId === projectFilter;
    return matchSearch && matchProject;
  });

  const openNew = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (d: Deliverable) => {
    setForm({
      projectId: d.projectId,
      serviceName: d.serviceName,
      totalQuantity: d.totalQuantity,
      completedQuantity: d.completedQuantity,
      type: d.type,
      status: d.status,
      notes: d.notes,
    });
    setEditId(d.id); setShowForm(true);
  };
  const handleSave = () => {
    if (!form.serviceName || !form.projectId) return;
    if (editId) updateDeliverable(editId, form);
    else addDeliverable(form);
    setShowForm(false);
  };
  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  const statusColors: Record<string, string> = {
    "Planned": "bg-stone-700 text-stone-300",
    "In Progress": "bg-amber-400/15 text-amber-400",
    "Blocked": "bg-rose-400/15 text-rose-400",
    "Completed": "bg-emerald-400/15 text-emerald-400",
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Tracking</p>
          <h2 className="mt-2 text-3xl font-semibold">Deliverables</h2>
          <p className="mt-2 text-sm text-stone-400">{deliverables.length} deliverables across {projects.length} projects</p>
        </div>
        <button onClick={openNew} className={btnPrimary}>+ New Deliverable</button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} max-w-sm`} />
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className={`${selectClass} max-w-[220px]`}>
          <option value="All">All Projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-left text-stone-500">
              <th className="p-4 font-medium">Deliverable</th>
              <th className="p-4 font-medium">Project</th>
              <th className="p-4 font-medium">Progress</th>
              <th className="p-4 font-medium">Due</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const pct = d.totalQuantity > 0 ? Math.round((d.completedQuantity / d.totalQuantity) * 100) : 0;
              const project = projects.find((p) => p.id === d.projectId);
              return (
                <tr key={d.id} className="border-b border-stone-800/50 transition hover:bg-stone-800/30">
                  <td className="p-4">
                    <p className="font-medium">{d.serviceName}</p>
                    <p className="text-xs text-stone-500">{d.type}</p>
                  </td>
                  <td className="p-4">
                    <p>{getProjectName(d.projectId)}</p>
                    <p className="text-xs text-stone-500">{project ? getClientName(project.clientId) : ""}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 rounded-full bg-stone-800">
                        <div className={`h-1.5 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-stone-400">{d.completedQuantity}/{d.totalQuantity}</span>
                    </div>
                  </td>
                  <td className="p-4 text-stone-400">{d.type}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[d.status] ?? ""}`}>{d.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">Edit</button>
                      <button onClick={() => { if (confirm("Delete?")) deleteDeliverable(d.id); }} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-stone-500">No deliverables found</div>
        )}
      </div>

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Deliverable" : "New Deliverable"}>
        <div className="space-y-4">
          <Field label="Project">
            <select className={selectClass} value={form.projectId ?? ""} onChange={(e) => set("projectId", e.target.value)}>
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Service Name"><input className={inputClass} value={form.serviceName ?? ""} onChange={(e) => set("serviceName", e.target.value)} placeholder="e.g. Story Reels" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Planned Qty"><input className={inputClass} type="number" value={form.totalQuantity ?? 0} onChange={(e) => set("totalQuantity", Number(e.target.value))} /></Field>
            <Field label="Completed Qty"><input className={inputClass} type="number" value={form.completedQuantity ?? 0} onChange={(e) => set("completedQuantity", Number(e.target.value))} /></Field>
          </div>
          <Field label="Type">
            <select className={selectClass} value={form.type ?? "One-Time"} onChange={(e) => set("type", e.target.value)}>
              {["Monthly", "One-Time"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={selectClass} value={form.status ?? "Planned"} onChange={(e) => set("status", e.target.value)}>
              {["Planned", "In Progress", "Blocked", "Completed"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea className={`${inputClass} min-h-[80px]`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update" : "Add Deliverable"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
