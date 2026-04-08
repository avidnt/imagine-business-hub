"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useData, type Invoice, type InvoiceItem } from "@/lib/data-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  SlideOver, Field, inputClass, selectClass,
  btnPrimary, btnSecondary, btnDanger,
} from "@/components/ui/slide-over";

const emptyLineItem = (): InvoiceItem => ({ description: "", amount: 0 });
const emptyForm = (): Partial<Invoice> => ({
  invoiceNumber: "", clientId: "", projectId: "", billingPeriod: "",
  issueDate: new Date().toISOString().slice(0, 10), dueDate: "",
  items: [emptyLineItem()], subtotal: 0, gstPercent: 18, gstAmount: 0,
  total: 0, status: "Draft", paymentDate: "", notes: "",
});

export default function InvoicesPage() {
  const {
    invoices, addInvoice, updateInvoice, deleteInvoice,
    clients, projects, getClientName, getProjectName,
  } = useData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Invoice>>(emptyForm());
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(q) ||
      getClientName(inv.clientId).toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const nextNumber = `INV-${String(invoices.length + 1).padStart(3, "0")}`;

  const openNew = () => {
    setForm({ ...emptyForm(), invoiceNumber: nextNumber });
    setEditId(null); setShowForm(true);
  };
  const openEdit = (inv: Invoice) => {
    setForm({
      invoiceNumber: inv.invoiceNumber, clientId: inv.clientId,
      projectId: inv.projectId, billingPeriod: inv.billingPeriod,
      issueDate: inv.issueDate, dueDate: inv.dueDate,
      items: [...inv.items], subtotal: inv.subtotal,
      gstPercent: inv.gstPercent, gstAmount: inv.gstAmount,
      total: inv.total, status: inv.status,
      paymentDate: inv.paymentDate, notes: inv.notes,
    });
    setEditId(inv.id); setShowForm(true);
  };

  const recalc = (items: InvoiceItem[], gstPct: number) => {
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const gstAmount = Math.round(subtotal * gstPct / 100);
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const updateLineItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...(form.items ?? [])];
    items[idx] = { ...items[idx], [field]: value };
    const totals = recalc(items, form.gstPercent ?? 18);
    setForm((p) => ({ ...p, items, ...totals }));
  };
  const addLineItem = () => setForm((p) => ({ ...p, items: [...(p.items ?? []), emptyLineItem()] }));
  const removeLineItem = (idx: number) => {
    const items = (form.items ?? []).filter((_, i) => i !== idx);
    const totals = recalc(items, form.gstPercent ?? 18);
    setForm((p) => ({ ...p, items, ...totals }));
  };

  const handleSave = () => {
    if (!form.clientId || !form.invoiceNumber) return;
    const totals = recalc(form.items ?? [], form.gstPercent ?? 18);
    const data = { ...form, ...totals };
    if (editId) updateInvoice(editId, data);
    else addInvoice(data);
    setShowForm(false);
  };

  const set = (k: string, v: string | number) => {
    if (k === "gstPercent") {
      const totals = recalc(form.items ?? [], Number(v));
      setForm((p) => ({ ...p, gstPercent: Number(v), ...totals }));
    } else {
      setForm((p) => ({ ...p, [k]: v }));
    }
  };

  const detailInvoice = showDetail ? invoices.find((i) => i.id === showDetail) : null;

  const statusColors: Record<string, string> = {
    Draft: "bg-stone-700 text-stone-300",
    Sent: "bg-sky-400/15 text-sky-400",
    Paid: "bg-emerald-400/15 text-emerald-400",
    Overdue: "bg-rose-400/15 text-rose-400",
  };

  /* Summary stats */
  const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((s, i) => s + i.total, 0);

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 border-b border-stone-800 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Billing</p>
          <h2 className="mt-2 text-3xl font-semibold">Invoices</h2>
          <p className="mt-2 text-sm text-stone-400">{invoices.length} invoices</p>
        </div>
        <button onClick={openNew} className={btnPrimary}>+ New Invoice</button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4">
          <p className="text-sm text-stone-500">Total Billed</p>
          <p className="mt-1 text-2xl font-bold text-stone-100">{formatCurrency(totalBilled)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-sm text-stone-500">Collected</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-stone-500">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Search invoices…" value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} max-w-sm`} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${selectClass} max-w-[160px]`}>
          <option value="All">All Status</option>
          {["Draft", "Sent", "Paid", "Overdue"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800 text-left text-stone-500">
              <th className="p-4 font-medium">Invoice</th>
              <th className="p-4 font-medium">Client</th>
              <th className="p-4 font-medium">Project</th>
              <th className="p-4 font-medium">Period</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Due</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-b border-stone-800/50 transition hover:bg-stone-800/30 cursor-pointer" onClick={() => setShowDetail(inv.id)}>
                <td className="p-4 font-semibold">{inv.invoiceNumber}</td>
                <td className="p-4 text-stone-400">{getClientName(inv.clientId)}</td>
                <td className="p-4 text-stone-400">{getProjectName(inv.projectId)}</td>
                <td className="p-4 text-stone-400">{inv.billingPeriod}</td>
                <td className="p-4 font-semibold">{formatCurrency(inv.total)}</td>
                <td className="p-4 text-stone-400">{formatDate(inv.dueDate)}</td>
                <td className="p-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[inv.status] ?? ""}`}>{inv.status}</span>
                </td>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(inv)} className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700">Edit</button>
                    <button onClick={() => { if (confirm("Delete?")) deleteInvoice(inv.id); }} className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-stone-500">No invoices found</div>}
      </div>

      {/* Detail */}
      <SlideOver open={!!showDetail} onClose={() => setShowDetail(null)} title="Invoice Details" wide>
        {detailInvoice && (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-amber-400">Imagine Studio</p>
                  <h3 className="mt-2 text-2xl font-bold">{detailInvoice.invoiceNumber}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[detailInvoice.status] ?? ""}`}>{detailInvoice.status}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-500">Bill To</p>
                  <p className="font-medium">{getClientName(detailInvoice.clientId)}</p>
                </div>
                <div>
                  <p className="text-stone-500">Project</p>
                  <p className="font-medium">{getProjectName(detailInvoice.projectId)}</p>
                </div>
                <div>
                  <p className="text-stone-500">Issue Date</p>
                  <p>{formatDate(detailInvoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-stone-500">Due Date</p>
                  <p>{formatDate(detailInvoice.dueDate)}</p>
                </div>
                <div>
                  <p className="text-stone-500">Billing Period</p>
                  <p>{detailInvoice.billingPeriod}</p>
                </div>
                {detailInvoice.paymentDate && (
                  <div>
                    <p className="text-stone-500">Payment Date</p>
                    <p className="text-emerald-400">{formatDate(detailInvoice.paymentDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-800 text-left text-stone-500">
                    <th className="pb-2">Description</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detailInvoice.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-stone-800/50">
                      <td className="py-2.5">{item.description}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="text-stone-400">
                    <td className="pt-3 text-right">Subtotal</td>
                    <td className="pt-3 text-right">{formatCurrency(detailInvoice.subtotal)}</td>
                  </tr>
                  <tr className="text-stone-400">
                    <td className="py-1 text-right">GST ({detailInvoice.gstPercent}%)</td>
                    <td className="py-1 text-right">{formatCurrency(detailInvoice.gstAmount)}</td>
                  </tr>
                  <tr className="border-t border-stone-700">
                    <td className="pt-3 text-right text-lg font-bold">Total</td>
                    <td className="pt-3 text-right text-lg font-bold text-amber-400">{formatCurrency(detailInvoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {detailInvoice.notes && <p className="text-sm text-stone-400">{detailInvoice.notes}</p>}

            <div className="flex flex-wrap gap-3">
              {detailInvoice.status === "Draft" && (
                <button onClick={() => { updateInvoice(detailInvoice.id, { status: "Sent" }); setShowDetail(null); }} className={btnPrimary}>Mark as Sent</button>
              )}
              {(detailInvoice.status === "Sent" || detailInvoice.status === "Overdue") && (
                <button onClick={() => { updateInvoice(detailInvoice.id, { status: "Paid", paymentDate: new Date().toISOString().slice(0, 10) }); setShowDetail(null); }} className={btnPrimary}>Mark as Paid</button>
              )}
              <button onClick={() => { setShowDetail(null); openEdit(detailInvoice); }} className={btnSecondary}>Edit</button>
              <button onClick={() => { if (confirm("Delete?")) { deleteInvoice(detailInvoice.id); setShowDetail(null); } }} className={btnDanger}>Delete</button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Form */}
      <SlideOver open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Invoice" : "New Invoice"} wide>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Invoice Number"><input className={inputClass} value={form.invoiceNumber ?? ""} onChange={(e) => set("invoiceNumber", e.target.value)} /></Field>
            <Field label="Client">
              <select className={selectClass} value={form.clientId ?? ""} onChange={(e) => set("clientId", e.target.value)}>
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Project">
              <select className={selectClass} value={form.projectId ?? ""} onChange={(e) => set("projectId", e.target.value)}>
                <option value="">Select project…</option>
                {projects.filter((p) => !form.clientId || p.clientId === form.clientId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Billing Period"><input className={inputClass} value={form.billingPeriod ?? ""} onChange={(e) => set("billingPeriod", e.target.value)} placeholder="e.g. March 2026" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Issue Date"><input className={inputClass} type="date" value={form.issueDate ?? ""} onChange={(e) => set("issueDate", e.target.value)} /></Field>
            <Field label="Due Date"><input className={inputClass} type="date" value={form.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value)} /></Field>
            <Field label="GST %"><input className={inputClass} type="number" value={form.gstPercent ?? 18} onChange={(e) => set("gstPercent", Number(e.target.value))} /></Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-stone-400">Line Items</p>
            <div className="space-y-2">
              {(form.items ?? []).map((item, idx) => (
                <div key={idx} className="flex items-end gap-3 rounded-xl border border-stone-800 bg-stone-950/60 p-3">
                  <div className="flex-1">
                    <Field label="Description"><input className={inputClass} value={item.description} onChange={(e) => updateLineItem(idx, "description", e.target.value)} /></Field>
                  </div>
                  <div className="w-32">
                    <Field label="Amount (₹)"><input className={inputClass} type="number" value={item.amount} onChange={(e) => updateLineItem(idx, "amount", Number(e.target.value))} /></Field>
                  </div>
                  <button onClick={() => removeLineItem(idx)} className="pb-0.5 text-rose-400 hover:text-rose-300">✕</button>
                </div>
              ))}
            </div>
            <button onClick={addLineItem} className="mt-2 text-sm text-amber-400 hover:text-amber-300">+ Add line item</button>
          </div>

          <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4 text-sm">
            <div className="flex justify-between"><span className="text-stone-400">Subtotal</span><span>{formatCurrency(form.subtotal ?? 0)}</span></div>
            <div className="mt-1 flex justify-between"><span className="text-stone-400">GST ({form.gstPercent ?? 18}%)</span><span>{formatCurrency(form.gstAmount ?? 0)}</span></div>
            <div className="mt-2 flex justify-between border-t border-stone-700 pt-2 text-lg font-bold"><span>Total</span><span className="text-amber-400">{formatCurrency(form.total ?? 0)}</span></div>
          </div>

          <Field label="Status">
            <select className={selectClass} value={form.status ?? "Draft"} onChange={(e) => set("status", e.target.value)}>
              {["Draft", "Sent", "Paid", "Overdue"].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Notes"><textarea className={`${inputClass} min-h-[60px]`} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className={btnPrimary}>{editId ? "Update" : "Create Invoice"}</button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
          </div>
        </div>
      </SlideOver>
    </AppShell>
  );
}
