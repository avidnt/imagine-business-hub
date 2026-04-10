"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Service } from "@/lib/data-context";
import {
  SlideOver,
  Field,
  inputClass,
  selectClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
} from "@/components/ui/slide-over";
import { formatCurrency } from "@/lib/utils";

const emptyForm = (): Partial<Service> => ({
  name: "",
  type: "One-Time",
  defaultQuantity: 1,
  price: 0,
  taskTemplate: { tasks: [] },
});

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useData();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Service>>(emptyForm());
  const [newTask, setNewTask] = useState("");

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setForm(emptyForm());
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (s: Service) => {
    setForm({
      name: s.name,
      type: s.type,
      defaultQuantity: s.defaultQuantity,
      price: s.price,
      taskTemplate: { tasks: s.taskTemplate?.tasks ?? [] },
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editId) updateService(editId, form);
    else addService(form);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this service?")) deleteService(id);
  };

  const addTask = () => {
    if (!newTask) return;
    const tasks = [...(form.taskTemplate?.tasks || []), newTask];
    setForm({ ...form, taskTemplate: { tasks } });
    setNewTask("");
  };

  const removeTask = (index: number) => {
    const tasks = form.taskTemplate?.tasks.filter((_, i) => i !== index) || [];
    setForm({ ...form, taskTemplate: { tasks } });
  };

  const set = (k: keyof Service, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Master Data</p>
          <h2 className="mt-2 text-3xl font-semibold">Services</h2>
          <p className="mt-2 text-sm text-stone-400">
            {services.length} services defined
          </p>
        </div>
        <button onClick={openNew} className={btnPrimary}>+ New Service</button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search services…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-sm`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s, i) => (
          <div
            key={s.id}
            className="group rounded-2xl border border-stone-800 bg-stone-900 p-5 transition-all hover:border-stone-700 hover:shadow-lg animate-[slideUp_0.35s_ease-out]"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold">{s.name}</p>
                <p className="mt-1 text-sm text-stone-400">{s.type}</p>
              </div>
              <span className="text-lg font-bold text-amber-400">{formatCurrency(s.price)}</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Task Template</p>
              <ul className="mt-2 space-y-1">
                {(s.taskTemplate?.tasks ?? []).map((t, idx) => (
                  <li key={idx} className="text-sm text-stone-400">• {t}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex gap-2 opacity-0 transition group-hover:opacity-100">
              <button onClick={() => openEdit(s)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">Edit</button>
              <button onClick={() => handleDelete(s.id)} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Service" : "New Service"}>
        <div className="space-y-4">
          <Field label="Service Name">
            <input className={inputClass} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Story Reels" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select className={selectClass} value={form.type ?? "One-Time"} onChange={(e) => set("type", e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="One-Time">One-Time</option>
              </select>
            </Field>
            <Field label="Price">
              <input type="number" className={inputClass} value={form.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} />
            </Field>
          </div>
          <Field label="Default Quantity">
            <input type="number" className={inputClass} value={form.defaultQuantity ?? 1} onChange={(e) => set("defaultQuantity", Number(e.target.value))} />
          </Field>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-stone-500">Task Template</label>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Add task step..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <button onClick={addTask} className={btnSecondary}>Add</button>
            </div>
            <ul className="mt-3 space-y-2">
              {(form.taskTemplate?.tasks || []).map((t, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-stone-800 p-2 text-sm text-stone-300">
                  {t}
                  <button onClick={() => removeTask(i)} className="text-stone-500 hover:text-rose-400">✕</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-6">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update Service" : "Create Service"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
