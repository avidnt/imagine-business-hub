"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useData } from "@/lib/data-context";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Trash2, CheckCircle, Download } from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { invoices, clients, projects, updateInvoice, deleteInvoice } = useData();
  
  const [invoice, setInvoice] = useState(invoices.find(i => i.id === id));

  useEffect(() => {
    setInvoice(invoices.find(i => i.id === id));
  }, [invoices, id]);

  if (!invoice) {
    return (
      <AppShell>
        <div className="p-8 text-center text-stone-500">Invoice not found.</div>
      </AppShell>
    );
  }

  const client = clients.find(c => c.id === invoice.clientId);
  const project = projects.find(p => p.id === invoice.projectId);

  const handleMarkPaid = () => {
    updateInvoice(invoice.id, { 
      status: "Paid", 
      paymentDate: new Date().toISOString() 
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoice(invoice.id);
      router.push("/invoices");
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header Let's add a basic professional header
    doc.setFontSize(28);
    doc.setTextColor(40, 40, 40);
    doc.text("INVOICE", 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 35);
    doc.text(`Issue Date: ${new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString()}`, 14, 40);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 14, 45);
    
    // Status
    doc.setFontSize(12);
    if (invoice.status === "Paid") doc.setTextColor(16, 185, 129); // emerald
    else if (invoice.status === "Overdue") doc.setTextColor(244, 63, 94); // rose
    else doc.setTextColor(59, 130, 246); // blue
    doc.text(invoice.status.toUpperCase(), 14, 55);

    // Business Info (Placeholder)
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Imagine Studio", pageWidth - 14, 25, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("123 Creative Studio Lane", pageWidth - 14, 30, { align: "right" });
    doc.text("Mumbai, India 400001", pageWidth - 14, 35, { align: "right" });
    doc.text("hello@imaginestudio.in", pageWidth - 14, 40, { align: "right" });

    // Client Info
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text("Billed To:", 14, 70);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    if (client) {
      doc.text(client.name, 14, 76);
      if (client.address) {
        const addressLines = doc.splitTextToSize(client.address, 70);
        doc.text(addressLines, 14, 82);
      } else {
        doc.text(client.email || "", 14, 82);
      }
      if (client.gstNumber) {
        doc.text(`GSTIN: ${client.gstNumber}`, 14, 95);
      }
    } else {
      doc.text("Client details not found.", 14, 76);
    }
    
    // Items Table
    const tableData = invoice.items.map(item => [
      item.name + (item.description ? `\n${item.description}` : ""),
      item.quantity.toString(),
      `INR ${item.rate.toFixed(2)}`,
      `INR ${item.amount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 105,
      head: [["Item Description", "Qty", "Rate", "Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [40, 40, 40] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("Subtotal:", pageWidth - 55, finalY);
    doc.text(`INR ${invoice.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: "right" });
    
    let currentY = finalY + 6;
    
    if (invoice.gstPercent > 0) {
      doc.text(`Tax (${invoice.gstPercent}%):`, pageWidth - 55, currentY);
      doc.text(`INR ${invoice.gstAmount.toFixed(2)}`, pageWidth - 14, currentY, { align: "right" });
      currentY += 6;
    }
    
    if (invoice.discount > 0) {
      doc.text("Discount:", pageWidth - 55, currentY);
      doc.text(`- INR ${invoice.discount.toFixed(2)}`, pageWidth - 14, currentY, { align: "right" });
      currentY += 6;
    }
    
    currentY += 2;
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", pageWidth - 55, currentY);
    doc.text(`INR ${invoice.total.toFixed(2)}`, pageWidth - 14, currentY, { align: "right" });

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", pageWidth / 2, doc.internal.pageSize.height - 20, { align: "center" });

    // Save
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/invoices"
            className="mb-4 inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-400 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Invoices
          </Link>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-semibold">{invoice.invoiceNumber}</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                invoice.status === "Paid"
                  ? "bg-emerald-400/15 text-emerald-400"
                  : invoice.status === "Sent"
                  ? "bg-sky-400/15 text-sky-400"
                  : invoice.status === "Overdue"
                  ? "bg-rose-400/15 text-rose-400"
                  : "bg-stone-700 text-stone-300"
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {invoice.status !== "Paid" && (
            <button
              onClick={handleMarkPaid}
              className="flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-sm font-medium hover:bg-stone-800 hover:text-emerald-400 transition"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Paid
            </button>
          )}
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-500"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center rounded-xl border border-stone-800 bg-stone-900 p-2.5 text-stone-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
            title="Delete Invoice"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* INVOICE PREVIEW */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between border-b border-stone-800 pb-8">
            <div>
              <h1 className="text-4xl font-light tracking-wide text-white">INVOICE</h1>
              <div className="mt-6 flex flex-col gap-1 text-sm text-stone-400">
                <p><span className="font-semibold text-stone-300">Invoice No:</span> {invoice.invoiceNumber}</p>
                <p><span className="font-semibold text-stone-300">Issue Date:</span> {new Date(invoice.issueDate || invoice.createdAt).toLocaleDateString()}</p>
                <p><span className="font-semibold text-stone-300">Due Date:</span> {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}</p>
              </div>
            </div>
            <div className="mt-8 md:mt-0 md:text-right text-sm text-stone-400 space-y-1">
              <p className="font-semibold text-stone-100 text-lg">Imagine Studio</p>
              <p>123 Creative Studio Lane</p>
              <p>Mumbai, India 400001</p>
              <p>hello@imaginestudio.in</p>
            </div>
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-3">Billed To</p>
              {client ? (
                <div className="text-sm text-stone-300 space-y-1">
                  <p className="font-semibold text-stone-100 text-base">{client.name}</p>
                  {client.address && <p className="whitespace-pre-line">{client.address}</p>}
                  {client.email && <p>{client.email}</p>}
                  {client.phone && <p>{client.phone}</p>}
                  {client.gstNumber && <p className="mt-2 text-stone-500 text-xs">GSTIN: {client.gstNumber}</p>}
                </div>
              ) : (
                <p className="text-sm text-stone-500">Client details not found.</p>
              )}
            </div>
            {project && (
              <div className="sm:text-right">
                <p className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-3">Project</p>
                <p className="text-sm font-medium text-stone-300">{project.name}</p>
              </div>
            )}
          </div>

          <div className="mt-12 overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-sm">
              <thead className="bg-stone-950/50">
                <tr className="text-left text-stone-400">
                  <th className="p-4 font-medium">Item</th>
                  <th className="p-4 font-medium text-center">Qty</th>
                  <th className="p-4 font-medium text-right">Rate</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-4">
                      <p className="font-medium text-stone-200">{item.name}</p>
                      {item.description && <p className="mt-1 text-xs text-stone-500">{item.description}</p>}
                    </td>
                    <td className="p-4 text-center text-stone-300">{item.quantity}</td>
                    <td className="p-4 text-right text-stone-300">{formatCurrency(item.rate)}</td>
                    <td className="p-4 text-right font-medium text-stone-200">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm text-stone-400 px-4">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.gstPercent > 0 && (
                <div className="flex justify-between text-sm text-stone-400 px-4">
                  <span>Tax ({invoice.gstPercent}%)</span>
                  <span>{formatCurrency(invoice.gstAmount)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-stone-400 px-4">
                  <span>Discount</span>
                  <span className="text-rose-400">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="mt-4 border-t border-stone-800 pt-4 flex justify-between text-lg font-bold px-4">
                <span>Total</span>
                <span className="text-amber-400">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR DETAILS */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-stone-500">
              Payment Information
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start justify-between">
                <span className="text-stone-400">Bank Name</span>
                <span className="font-medium text-stone-200">HDFC Bank</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-stone-400">Account No.</span>
                <span className="font-medium text-stone-200">50123456789012</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-stone-400">IFSC Code</span>
                <span className="font-medium text-stone-200">HDFC0001234</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-stone-500">
              Notes
            </h3>
            <p className="text-sm text-stone-400 whitespace-pre-line">
              {invoice.notes || "Please include the invoice number in your payment reference. Thank you for your business."}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
