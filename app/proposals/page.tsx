"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Proposal, type ProposalItem } from "@/lib/data-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  SlideOver, Field, inputClass, selectClass,
  btnPrimary, btnSecondary, btnDanger,
} from "@/components/ui/slide-over";

const emptyItem = (): ProposalItem => ({ description: "", quantity: 1, unit: "unit", rate: 0, amount: 0 });
const emptyForm = (): Partial<Proposal> => ({
  proposalNumber: "", clientId: "", date: new Date().toISOString().slice(0, 10),
  validUntil: "", projectType: "Monthly Retainer",
  items: [emptyItem()], totalAmount: 0,
  terms: "", status: "Draft", notes: "",
});

export default function ProposalsPage() {
  const { proposals, addProposal, updateProposal, deleteProposal, clients, addProject, getClientName } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Proposal>>(emptyForm());
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const filtered = proposals.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.proposalNumber.toLowerCase().includes(q) || getClientName(p.clientId).toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const nextNumber = `PR-${String(proposals.length + 1).padStart(3, "0")}`;

  const openNew = () => {
    setForm({ ...emptyForm(), proposalNumber: nextNumber });
    setEditId(null); setShowForm(true);
  };
  const openEdit = (p: Proposal) => {
    setForm({ proposalNumber: p.proposalNumber, clientId: p.clientId, date: p.date, validUntil: p.validUntil, projectType: p.projectType, items: [...p.items], totalAmount: p.totalAmount, terms: p.terms, status: p.status, notes: p.notes });
    setEditId(p.id); setShowForm(true);
  };

  const recalcTotal = (items: ProposalItem[]) => items.reduce((s, i) => s + i.amount, 0);

  const updateItem = (idx: number, field: keyof ProposalItem, value: string | number) => {
    const items = [...(form.items ?? [])];
    const item = { ...items[idx], [field]: value };
    if (field === "quantity" || field === "rate") {
      item.amount = Number(item.quantity) * Number(item.rate);
    }
    items[idx] = item;
    setForm((p) => ({ ...p, items, totalAmount: recalcTotal(items) }));
  };
  const addItem = () => setForm((p) => ({ ...p, items: [...(p.items ?? []), emptyItem()] }));
  const removeItem = (idx: number) => {
    const items = (form.items ?? []).filter((_, i) => i !== idx);
    setForm((p) => ({ ...p, items, totalAmount: recalcTotal(items) }));
  };

  const handleSave = () => {
    if (!form.clientId || !form.proposalNumber) return;
    const total = recalcTotal(form.items ?? []);
    const data = { ...form, totalAmount: total };
    if (editId) updateProposal(editId, data);
    else addProposal(data);
    setShowForm(false);
  };

  const convertToProject = (proposal: Proposal) => {
    if (proposal.status !== "Approved") {
      updateProposal(proposal.id, { status: "Approved" });
    }
    addProject({
      name: `${getClientName(proposal.clientId)} — ${proposal.projectType}`,
      clientId: proposal.clientId,
      type: proposal.projectType === "Monthly Retainer" ? "Monthly" : "One-Time",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      owner: "",
      status: "Planning",
      billingValue: proposal.totalAmount,
      proposalId: proposal.id,
      notes: `Converted from proposal ${proposal.proposalNumber}`,
    });
    alert("Project created from proposal!");
    setShowDetail(null);
  };

  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));
  const detailProposal = showDetail ? proposals.find((p) => p.id === showDetail) : null;

  const statusColors: Record<string, string> = {
    Draft: "bg-stone-700 text-stone-300",
    Sent: "bg-sky-400/15 text-sky-400",
    Approved: "bg-emerald-400/15 text-emerald-400",
    Rejected: "bg-rose-400/15 text-rose-400",
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Sales</p>
          <h2 className="mt-2 text-3xl font-semibold">Proposals</h2>
          <p className="mt-2 text-sm text-stone-400">{proposals.length} proposals · {proposals.filter((p) => p.status === "Approved").length} approved</p>
        </div>
        <button onClick={openNew} className={btnPrimary}>+ New Proposal</button>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} max-w-sm`} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectClass} max-w-[160px]`}>
          <option value="All">All Status</option>
          {["Draft", "Sent", "Approved", "Rejected"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p, i) => (
          <div
            key={p.id}
            className="group cursor-pointer rounded-2xl border border-stone-800 bg-stone-900 p-5 transition-all hover:border-stone-700 hover:shadow-lg animate-[slideUp_0.35s_ease-out]"
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
            onClick={() => setShowDetail(p.id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold">{p.proposalNumber}</p>
                <p className="mt-1 text-sm text-stone-400">{getClientName(p.clientId)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[p.status] ?? ""}`}>{p.status}</span>
            </div>
            <p className="mt-3 text-sm text-stone-500">{p.projectType}</p>
            <p className="mt-1 text-2xl font-bold text-amber-400">{formatCurrency(p.totalAmount)}</p>
            <p className="mt-2 text-xs text-stone-500">
              {formatDate(p.date)} · Valid until {formatDate(p.validUntil)}
            </p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center"><p className="text-lg text-stone-500">No proposals yet</p><button onClick={openNew} className={`${btnPrimary} mt-4`}>Create your first proposal</button></div>
      )}

      {/* Detail */}
      <SlideOver open={!!showDetail} onClose={() => setShowDetail(null)} title="Proposal Details" wide>
        {detailProposal && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{detailProposal.proposalNumber}</h3>
                <p className="text-stone-400">{getClientName(detailProposal.clientId)} · {detailProposal.projectType}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[detailProposal.status] ?? ""}`}>{detailProposal.status}</span>
            </div>

            <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-800 text-left text-stone-500"><th className="pb-2">Item</th><th className="pb-2">Qty</th><th className="pb-2">Rate</th><th className="pb-2 text-right">Amount</th></tr></thead>
                <tbody>
                  {detailProposal.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-stone-800/50">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2">{item.quantity} {item.unit}</td>
                      <td className="py-2">{formatCurrency(item.rate)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan={3} className="pt-3 text-right font-semibold">Total</td><td className="pt-3 text-right text-lg font-bold text-amber-400">{formatCurrency(detailProposal.totalAmount)}</td></tr></tfoot>
              </table>
            </div>

            {detailProposal.terms && <p className="text-sm text-stone-400"><strong className="text-stone-300">Terms:</strong> {detailProposal.terms}</p>}
            {detailProposal.notes && <p className="text-sm text-stone-400"><strong className="text-stone-300">Notes:</strong> {detailProposal.notes}</p>}

            <div className="flex flex-wrap gap-3">
              {detailProposal.status !== "Approved" && (
                <button onClick={() => convertToProject(detailProposal)} className={btnPrimary}>
                  ✓ Approve &amp; Create Project
                </button>
              )}
              <button onClick={() => { setShowDetail(null); openEdit(detailProposal); }} className={btnSecondary}>Edit</button>
              {detailProposal.status === "Draft" && (
                <button onClick={() => { updateProposal(detailProposal.id, { status: "Sent" }); setShowDetail(null); }} className={btnSecondary}>Mark as Sent</button>
              )}
              <button onClick={() => { if (confirm("Delete?")) deleteProposal(detailProposal.id); setShowDetail(null); }} className={btnDanger}>Delete</button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Form */}
      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Proposal" : "New Proposal"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Proposal Number"><input className={inputClass} value={form.proposalNumber ?? ""} onChange={(e) => set("proposalNumber", e.target.value)} /></Field>
            <Field label="Client">
              <select className={selectClass} value={form.clientId ?? ""} onChange={(e) => set("clientId", e.target.value)}>
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Date"><input className={inputClass} type="date" value={form.date ?? ""} onChange={(e) => set("date", e.target.value)} /></Field>
            <Field label="Valid Until"><input className={inputClass} type="date" value={form.validUntil ?? ""} onChange={(e) => set("validUntil", e.target.value)} /></Field>
            <Field label="Type">
              <select className={selectClass} value={form.projectType ?? "Monthly Retainer"} onChange={(e) => set("projectType", e.target.value)}>
                {["Monthly Retainer", "One-Time", "Custom"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-stone-400">Line Items</p>
            <div className="space-y-2">
              {(form.items ?? []).map((item, idx) => (
                <div key={idx} className="flex items-end gap-2 rounded-xl border border-stone-800 bg-stone-950/60 p-3">
                  <Field label="Description"><input className={inputClass} value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} /></Field>
                  <Field label="Qty"><input className={`${inputClass} w-20`} type="number" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} /></Field>
                  <Field label="Unit"><input className={`${inputClass} w-20`} value={item.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} /></Field>
                  <Field label="Rate"><input className={`${inputClass} w-24`} type="number" value={item.rate} onChange={(e) => updateItem(idx, "rate", Number(e.target.value))} /></Field>
                  <div className="pb-0.5 text-sm font-semibold text-amber-400">{formatCurrency(item.amount)}</div>
                  <button onClick={() => removeItem(idx)} className="pb-0.5 text-rose-400 hover:text-rose-300">✕</button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-2 text-sm text-amber-400 hover:text-amber-300">+ Add line item</button>
            <p className="mt-2 text-right text-lg font-bold text-amber-400">Total: {formatCurrency(form.totalAmount ?? 0)}</p>
          </div>

          <Field label="Terms"><textarea className={`${inputClass} min-h-[60px]`} value={form.terms ?? ""} onChange={(e) => set("terms", e.target.value)} /></Field>
          <Field label="Notes"><textarea className={`${inputClass} min-h-[60px]`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update" : "Create Proposal"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
