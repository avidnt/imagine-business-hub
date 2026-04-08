"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Client } from "@/lib/data-context";
import {
  SlideOver,
  Field,
  inputClass,
  selectClass,
  btnPrimary,
  btnSecondary,
  btnDanger,
} from "@/components/ui/slide-over";

const emptyForm = (): Partial<Client> => ({
  name: "", contactPerson: "", phone: "", email: "", address: "",
  gstNumber: "", industry: "", status: "Active", notes: "",
});

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, projects } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Client>>(emptyForm());
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openNew = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit = (c: Client) => {
    setForm({ name: c.name, contactPerson: c.contactPerson, phone: c.phone, email: c.email, address: c.address, gstNumber: c.gstNumber, industry: c.industry, status: c.status, notes: c.notes });
    setEditId(c.id); setShowForm(true);
  };
  const handleSave = () => {
    if (!form.name) return;
    if (editId) updateClient(editId, form);
    else addClient(form);
    setShowForm(false);
  };
  const handleDelete = (id: string) => {
    if (confirm("Delete this client?")) deleteClient(id);
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const detailClient = showDetail ? clients.find((c) => c.id === showDetail) : null;
  const clientProjects = detailClient ? projects.filter((p) => p.clientId === detailClient.id) : [];

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Management</p>
          <h2 className="mt-2 text-3xl font-semibold">Clients</h2>
          <p className="mt-2 text-sm text-stone-400">
            {clients.length} clients · {clients.filter((c) => c.status === "Active").length} active
          </p>
        </div>
        <button onClick={openNew} className={btnPrimary}>+ New Client</button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="text" placeholder="Search clients…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} max-w-sm`}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectClass} max-w-[200px]`}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Proposal Stage">Proposal Stage</option>
        </select>
      </div>

      {/* Client cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c, i) => (
          <div
            key={c.id}
            className="group rounded-2xl border border-stone-800 bg-stone-900 p-5 transition-all hover:border-stone-700 hover:shadow-lg animate-[slideUp_0.35s_ease-out]"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between">
              <div className="cursor-pointer" onClick={() => setShowDetail(c.id)}>
                <p className="text-lg font-semibold transition group-hover:text-amber-400">{c.name}</p>
                <p className="mt-1 text-sm text-stone-400">{c.contactPerson}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                c.status === "Active" ? "bg-emerald-400/15 text-emerald-400"
                  : c.status === "Proposal Stage" ? "bg-amber-400/15 text-amber-400"
                    : "bg-stone-700 text-stone-400"
              }`}>{c.status}</span>
            </div>
            <p className="mt-3 text-sm text-stone-500">{c.industry}</p>
            <p className="mt-1 text-sm text-stone-500">{c.email}</p>
            <p className="mt-1 text-sm text-stone-500">{c.phone}</p>
            {c.notes && <p className="mt-3 text-sm text-stone-400 line-clamp-2">{c.notes}</p>}
            <div className="mt-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
              <button onClick={() => openEdit(c)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">Edit</button>
              <button onClick={() => setShowDetail(c.id)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">View</button>
              <button onClick={() => handleDelete(c.id)} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg text-stone-500">No clients found</p>
          <button onClick={openNew} className={`${btnPrimary} mt-4`}>Add your first client</button>
        </div>
      )}

      {/* Add/Edit Form */}
      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Client" : "New Client"}>
        <div className="space-y-4">
          <Field label="Client Name"><input className={inputClass} value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} placeholder="e.g. ABC Builders" /></Field>
          <Field label="Contact Person"><input className={inputClass} value={form.contactPerson ?? ""} onChange={(e) => set("contactPerson", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone"><input className={inputClass} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Email"><input className={inputClass} type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
          </div>
          <Field label="Address"><input className={inputClass} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="GST Number"><input className={inputClass} value={form.gstNumber ?? ""} onChange={(e) => set("gstNumber", e.target.value)} /></Field>
            <Field label="Industry"><input className={inputClass} value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value)} /></Field>
          </div>
          <Field label="Status">
            <select className={selectClass} value={form.status ?? "Active"} onChange={(e) => set("status", e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Proposal Stage">Proposal Stage</option>
            </select>
          </Field>
          <Field label="Notes"><textarea className={`${inputClass} min-h-[80px]`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update Client" : "Create Client"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </SlideOver>

      {/* Detail View */}
      <SlideOver open={!!showDetail} onClose={() => setShowDetail(null)} title="Client Details" wide>
        {detailClient && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{detailClient.name}</h3>
                  <p className="mt-1 text-stone-400">{detailClient.contactPerson}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  detailClient.status === "Active" ? "bg-emerald-400/15 text-emerald-400"
                    : detailClient.status === "Proposal Stage" ? "bg-amber-400/15 text-amber-400"
                      : "bg-stone-700 text-stone-400"
                }`}>{detailClient.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-stone-500">Industry:</span> <span className="text-stone-200">{detailClient.industry}</span></div>
                <div><span className="text-stone-500">Phone:</span> <span className="text-stone-200">{detailClient.phone}</span></div>
                <div><span className="text-stone-500">Email:</span> <span className="text-stone-200">{detailClient.email}</span></div>
                <div><span className="text-stone-500">GST:</span> <span className="text-stone-200">{detailClient.gstNumber || "—"}</span></div>
                <div className="col-span-2"><span className="text-stone-500">Address:</span> <span className="text-stone-200">{detailClient.address}</span></div>
              </div>
              {detailClient.notes && <p className="mt-4 text-sm text-stone-400">{detailClient.notes}</p>}
            </div>

            <div>
              <h4 className="mb-3 font-semibold">Projects ({clientProjects.length})</h4>
              {clientProjects.length > 0 ? (
                <div className="space-y-2">
                  {clientProjects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-sm">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-stone-500">{p.type} · {p.status}</p>
                      </div>
                      <span className="text-stone-400">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.billingValue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-stone-500">No projects yet.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowDetail(null); openEdit(detailClient); }} className={btnSecondary}>Edit Client</button>
              <button onClick={() => { handleDelete(detailClient.id); setShowDetail(null); }} className={btnDanger}>Delete</button>
            </div>
          </div>
        )}
      </SlideOver>
    </AppShell>
  );
}
