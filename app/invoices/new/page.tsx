"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-context";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { InvoiceItem } from "@/lib/data-context";

export default function NewInvoicePage() {
  const router = useRouter();
  const { clients, projects, invoices, addInvoice } = useData();

  // Next Invoice Number
  const nextInvoiceNum = useMemo(() => {
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.invoiceNumber.includes(`INV-${year}`)).length + 1;
    return `INV-${year}-${count.toString().padStart(4, "0")}`;
  }, [invoices]);

  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNum);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<"Draft" | "Sent" | "Paid" | "Overdue">("Draft");
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: "", description: "", quantity: 1, rate: 0, amount: 0 }
  ]);
  
  const [gstPercent, setGstPercent] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  }, [items]);

  const gstAmount = useMemo(() => {
    return subtotal * (gstPercent / 100);
  }, [subtotal, gstPercent]);

  const total = useMemo(() => {
    return subtotal + gstAmount - discount;
  }, [subtotal, gstAmount, discount]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    item.amount = item.quantity * item.rate;
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleSave = () => {
    if (!clientId) {
      alert("Please select a client.");
      return;
    }
    
    const hasEmptyItem = items.some(i => !i.name || i.quantity <= 0 || i.rate < 0);
    if (hasEmptyItem) {
      alert("Please ensure all items have a name, quantity > 0, and valid rate.");
      return;
    }

    const id = addInvoice({
      invoiceNumber,
      clientId,
      projectId,
      issueDate,
      dueDate,
      items,
      subtotal,
      gstPercent,
      gstAmount,
      discount,
      total,
      status,
    });
    
    router.push(`/invoices/${id}`);
  };

  return (
    <AppShell>
      <div className="mb-8">
        <Link
          href="/invoices"
          className="mb-4 inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-400 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Link>
        <h2 className="text-3xl font-semibold">Create Invoice</h2>
      </div>

      <div className="mx-auto max-w-4xl rounded-2xl border border-stone-800 bg-stone-900 p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Invoice Info */}
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-400">Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full rounded-xl border border-stone-800 bg-stone-950 p-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-stone-800 bg-stone-950 p-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-400">Client *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-stone-800 bg-stone-950 p-3 text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="">Select a Client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-400">Project / Proposal (Optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-stone-800 bg-stone-950 p-3 text-sm focus:border-amber-400 focus:outline-none"
            >
              <option value="">None</option>
              {projects.filter(p => !clientId || p.clientId === clientId).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-400">Issue Date *</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-xl border border-stone-800 bg-stone-950 p-3 text-sm [color-scheme:dark] focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-400">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              // If not paid and overdue in logic -> check if today > dueDate 
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-stone-800 bg-stone-950 p-3 text-sm [color-scheme:dark] focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* LINE ITEMS */}
        <div className="mt-10">
          <h3 className="mb-4 text-lg font-semibold">Items</h3>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-950/50 p-4 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">Item Name</label>
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        placeholder="Web Design, Consultation..."
                        className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2 text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">Description (Optional)</label>
                      <input 
                        type="text" 
                        value={item.description || ''}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="Details..."
                        className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2 text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 grid-cols-3 sm:w-2/3">
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">Quantity</label>
                      <input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2 text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">Rate</label>
                      <input 
                        type="number" 
                        min="0"
                        value={item.rate}
                        onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-stone-800 bg-stone-950 p-2 text-sm focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">Amount</label>
                      <div className="p-2 text-sm font-medium text-stone-300">
                        ₹{item.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                {items.length > 1 && (
                  <button 
                    onClick={() => removeItem(idx)}
                    className="mt-6 p-2 text-stone-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>

        {/* FINANCIALS */}
        <div className="mt-10 flex justify-end">
          <div className="w-full max-w-sm space-y-3 rounded-xl border border-stone-800 bg-stone-950 p-5">
            <div className="flex items-center justify-between text-sm text-stone-400">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-stone-400">Tax (%)</span>
              <input 
                type="number" 
                min="0" max="100"
                value={gstPercent}
                onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)}
                className="w-20 rounded-lg border border-stone-800 bg-stone-900 p-1.5 text-right font-medium focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-stone-400">Discount (flat)</span>
              <input 
                type="number" 
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-lg border border-stone-800 bg-stone-900 p-1.5 text-right font-medium focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="my-2 border-t border-stone-800" />
            
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-amber-400">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-8 flex justify-end gap-3">
          <Link
            href="/invoices"
            className="rounded-xl border border-stone-800 px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-500 transition shadow-lg shadow-amber-400/10"
          >
            Create Invoice
          </button>
        </div>
      </div>
    </AppShell>
  );
}
