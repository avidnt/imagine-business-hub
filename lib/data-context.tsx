"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

// ═══════════════════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════════════════

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ═══════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════

export type Client = {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  industry: string;
  status: "Active" | "Inactive" | "Proposal Stage";
  notes: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  clientId: string;
  type: "Monthly" | "One-Time";
  startDate: string;
  endDate: string;
  owner: string;
  status: "Planning" | "In Progress" | "Review" | "Completed" | "On Hold";
  billingValue: number;
  proposalId: string;
  notes: string;
  createdAt: string;
};

export type Deliverable = {
  id: string;
  projectId: string;
  serviceName?: string;
  totalQuantity: number;
  completedQuantity: number;
  type: "Monthly" | "One-Time";
  status: "Planned" | "In Progress" | "Blocked" | "Completed";
  notes: string;
};

export type Task = {
  id: string;
  projectId: string;
  deliverableId: string;
  title: string;
  assignee: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  status: "Todo" | "In Progress" | "Review" | "Done" | "Blocked";
  notes: string;
  progressTotal?: number;
  progressCompleted?: number;
};

export type Service = {
  id: string;
  name: string;
  type: "Monthly" | "One-Time";
  defaultQuantity: number;
  price: number;
  taskTemplate: { tasks: string[] };
  createdAt: string;
};

export type ProposalItem = {
  serviceId?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  type: "Monthly" | "One-Time";
};

export type Proposal = {
  id: string;
  proposalNumber: string;
  clientId: string;
  date: string;
  validUntil: string;
  projectType: "Monthly Retainer" | "One-Time" | "Custom";
  items: ProposalItem[];
  totalAmount: number;
  terms: string;
  status: "Draft" | "Sent" | "Accepted" | "Rejected";
  notes: string;
  createdAt: string;
};

export type ProposalService = {
  id: string;
  proposalId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  price: number;
  type: "Monthly" | "One-Time";
  createdAt: string;
};

export type InvoiceItem = {
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  discount: number;
  total: number;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  paymentDate: string;
  notes: string;
  createdAt: string;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  type: "Fixed" | "Variable" | "Project";
  projectId: string;
  vendor: string;
  notes: string;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  createdAt: string;
};

// ═══════════════════════════════════════════════════
//  SUPABASE REAL-TIME HOOK
// ═══════════════════════════════════════════════════

function useSupabaseState<T extends { id: string }>(table: string) {
  const [data, setData] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 1. Fetch all rows on mount
    async function fetchData() {
      const { data: rows, error } = await supabase
        .from(table)
        .select("*");

      if (cancelled) return;

      if (!error && rows) {
        setData(rows as T[]);
      }
      setLoaded(true);
    }

    fetchData();

    // 2. Subscribe to real-time changes from other users
    const channel = supabase
      .channel(`realtime_${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setData((prev) => {
              // Prevent duplicates from our own optimistic insert
              if (prev.some((item) => item.id === (payload.new as T).id))
                return prev;
              return [...prev, payload.new as T];
            });
          } else if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev.map((item) =>
                item.id === (payload.new as T).id
                  ? (payload.new as T)
                  : item,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setData((prev) =>
              prev.filter(
                (item) => item.id !== (payload.old as { id: string }).id,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      cancelled = true;
    };
  }, [table]);

  return [data, setData, loaded] as const;
}

// ═══════════════════════════════════════════════════
//  CONTEXT TYPE
// ═══════════════════════════════════════════════════

type DataContextType = {
  loading: boolean;

  clients: Client[];
  addClient: (d: Partial<Client>) => string;
  updateClient: (id: string, d: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  projects: Project[];
  addProject: (d: Partial<Project>) => string;
  updateProject: (id: string, d: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  deliverables: Deliverable[];
  addDeliverable: (d: Partial<Deliverable>) => string;
  updateDeliverable: (id: string, d: Partial<Deliverable>) => void;
  deleteDeliverable: (id: string) => void;

  tasks: Task[];
  addTask: (d: Partial<Task>) => string;
  updateTask: (id: string, d: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  proposals: Proposal[];
  addProposal: (d: Partial<Proposal>) => string;
  updateProposal: (id: string, d: Partial<Proposal>) => void;
  deleteProposal: (id: string) => void;

  proposalServices: ProposalService[];
  addProposalService: (d: Partial<ProposalService>) => string;
  updateProposalService: (id: string, d: Partial<ProposalService>) => void;
  deleteProposalService: (id: string) => void;

  invoices: Invoice[];
  addInvoice: (d: Partial<Invoice>) => string;
  updateInvoice: (id: string, d: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  expenses: Expense[];
  addExpense: (d: Partial<Expense>) => string;
  updateExpense: (id: string, d: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  services: Service[];
  addService: (d: Partial<Service>) => string;
  updateService: (id: string, d: Partial<Service>) => void;
  deleteService: (id: string) => void;

  getClientName: (id: string) => string;
  getProjectName: (id: string) => string;
};

// ═══════════════════════════════════════════════════
//  CONTEXT
// ═══════════════════════════════════════════════════

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients, clientsLoaded] =
    useSupabaseState<Client>("clients");
  const [projects, setProjects, projectsLoaded] =
    useSupabaseState<Project>("projects");
  const [deliverables, setDeliverables, deliverablesLoaded] =
    useSupabaseState<Deliverable>("deliverables");
  const [tasks, setTasks, tasksLoaded] = useSupabaseState<Task>("tasks");
  const [proposals, setProposals, proposalsLoaded] =
    useSupabaseState<Proposal>("proposals");
  const [proposalServices, setProposalServices, proposalServicesLoaded] =
    useSupabaseState<ProposalService>("proposal_services");
  const [rawInvoices, setInvoices, invoicesLoaded] =
    useSupabaseState<Invoice>("invoices");
  const [expenses, setExpenses, expensesLoaded] =
    useSupabaseState<Expense>("expenses");
  const [services, setServices, servicesLoaded] =
    useSupabaseState<Service>("services");

  // Compute dynamic Overdue status for invoices
  const invoices = React.useMemo(() => {
    return rawInvoices.map((inv) => {
      if (inv.status !== "Paid" && inv.dueDate) {
        const isOverdue = new Date() > new Date(inv.dueDate);
        if (isOverdue && inv.status !== "Overdue") {
          return { ...inv, status: "Overdue" } as Invoice;
        }
      }
      return inv;
    });
  }, [rawInvoices]);

  const loading = !(
    clientsLoaded &&
    projectsLoaded &&
    deliverablesLoaded &&
    tasksLoaded &&
    proposalsLoaded &&
    proposalServicesLoaded &&
    invoicesLoaded &&
    expensesLoaded &&
    servicesLoaded
  );

  /* ── generic helpers ─────────────────────────── */

  function addEntity<T extends { id: string }>(
    table: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    data: Partial<T>,
  ): string {
    const id = generateId();
    const entity = { ...data, id, createdAt: new Date().toISOString() } as unknown as T;

    // Optimistic local update (instant UI feedback)
    setter((prev) => [...prev, entity]);

    // Persist to Supabase (fire-and-forget)
    supabase
      .from(table)
      .insert(entity as any)
      .then(({ error }) => {
        if (error) console.error(`[Supabase] Insert ${table} failed:`, error);
      });

    return id;
  }

  function updateEntity<T extends { id: string }>(
    table: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
    data: Partial<T>,
  ) {
    // Optimistic local update
    setter((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item)),
    );

    // Persist to Supabase
    supabase
      .from(table)
      .update(data as any)
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error(`[Supabase] Update ${table} failed:`, error);
      });
  }

  function syncProposalServicesForProposal(proposalId: string, items: ProposalItem[] = []) {
    const selected = items
      .filter((item) => !!item.serviceId)
      .map((item) => ({
        proposalId,
        serviceId: item.serviceId!,
        serviceName: item.description,
        quantity: Number(item.quantity || 0),
        price: Number(item.rate || 0),
        type: item.type,
      }));

    const existing = proposalServices.filter((ps) => ps.proposalId === proposalId);

    // remove old
    for (const row of existing) {
      setProposalServices((prev) => prev.filter((p) => p.id !== row.id));
      supabase.from("proposal_services").delete().eq("id", row.id).then(({ error }) => {
        if (error) console.error("[Supabase] Delete proposal_services failed:", error);
      });
    }

    // insert latest
    for (const row of selected) {
      const id = generateId();
      const entity: ProposalService = {
        id,
        createdAt: new Date().toISOString(),
        ...row,
      };
      setProposalServices((prev) => [...prev, entity]);
      supabase.from("proposal_services").insert(entity as any).then(({ error }) => {
        if (error) console.error("[Supabase] Insert proposal_services failed:", error);
      });
    }
  }

  function runProposalAcceptanceAutomation(proposal: Proposal) {
    const existingProject = projects.find((p) => p.proposalId === proposal.id);
    if (existingProject) return;

    const projectId = addEntity<Project>("projects", setProjects, {
      name: `${clients.find((c) => c.id === proposal.clientId)?.name ?? "Client"} — ${proposal.proposalNumber}`,
      clientId: proposal.clientId,
      type: proposal.projectType === "Monthly Retainer" ? "Monthly" : "One-Time",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      owner: "",
      status: "In Progress",
      billingValue: proposal.totalAmount,
      proposalId: proposal.id,
      notes: `Auto-created from accepted proposal ${proposal.proposalNumber}`,
    });

    const serviceItems = proposal.items.filter((item) => item.serviceId);

    serviceItems.forEach((item) => {
      const deliverableId = addEntity<Deliverable>("deliverables", setDeliverables, {
        projectId,
        serviceName: item.description,
        totalQuantity: item.quantity,
        completedQuantity: 0,
        type: item.type,
        status: "Planned",
        notes: `Generated from proposal ${proposal.proposalNumber}`,
      });

      const service = services.find((s) => s.id === item.serviceId);
      const templateTasks = service?.taskTemplate?.tasks ?? [];

      templateTasks.forEach((taskName) => {
        addEntity<Task>("tasks", setTasks, {
          projectId,
          deliverableId,
          title: taskName,
          assignee: "",
          priority: "Medium",
          dueDate: "",
          status: "Todo",
          notes: `Generated from service template: ${service?.name ?? item.description}`,
          progressTotal: item.quantity,
          progressCompleted: 0,
        });
      });
    });
  }

  function removeEntity<T extends { id: string }>(
    table: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    id: string,
  ) {
    // Optimistic local update
    setter((prev) => prev.filter((item) => item.id !== id));

    // Persist to Supabase
    supabase
      .from(table)
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error(`[Supabase] Delete ${table} failed:`, error);
      });
  }

  const value: DataContextType = {
    loading,

    clients,
    addClient: (d) => addEntity("clients", setClients, d),
    updateClient: (id, d) => updateEntity("clients", setClients, id, d),
    deleteClient: (id) => removeEntity("clients", setClients, id),

    projects,
    addProject: (d) => addEntity("projects", setProjects, d),
    updateProject: (id, d) => updateEntity("projects", setProjects, id, d),
    deleteProject: (id) => removeEntity("projects", setProjects, id),

    deliverables,
    addDeliverable: (d) => addEntity("deliverables", setDeliverables, d),
    updateDeliverable: (id, d) =>
      updateEntity("deliverables", setDeliverables, id, d),
    deleteDeliverable: (id) =>
      removeEntity("deliverables", setDeliverables, id),

    tasks,
    addTask: (d) => addEntity("tasks", setTasks, d),
    updateTask: (id, d) => updateEntity("tasks", setTasks, id, d),
    deleteTask: (id) => removeEntity("tasks", setTasks, id),

    proposals,
    addProposal: (d) => {
      const id = addEntity("proposals", setProposals, d);
      syncProposalServicesForProposal(id, d.items ?? []);
      return id;
    },
    updateProposal: (id, d) => {
      const previous = proposals.find((p) => p.id === id);
      updateEntity("proposals", setProposals, id, d);

      if (d.items) {
        syncProposalServicesForProposal(id, d.items);
      }

      const nextStatus = d.status ?? previous?.status;
      if (nextStatus === "Accepted" && previous?.status !== "Accepted" && previous) {
        runProposalAcceptanceAutomation({ ...previous, ...d });
      }
    },
    deleteProposal: (id) => {
      removeEntity("proposals", setProposals, id);
      proposalServices
        .filter((ps) => ps.proposalId === id)
        .forEach((ps) => removeEntity("proposal_services", setProposalServices, ps.id));
    },

    proposalServices,
    addProposalService: (d) => addEntity("proposal_services", setProposalServices, d),
    updateProposalService: (id, d) =>
      updateEntity("proposal_services", setProposalServices, id, d),
    deleteProposalService: (id) => removeEntity("proposal_services", setProposalServices, id),

    invoices,
    addInvoice: (d) => addEntity("invoices", setInvoices, d),
    updateInvoice: (id, d) => updateEntity("invoices", setInvoices, id, d),
    deleteInvoice: (id) => removeEntity("invoices", setInvoices, id),

    expenses,
    addExpense: (d) => addEntity("expenses", setExpenses, d),
    updateExpense: (id, d) => updateEntity("expenses", setExpenses, id, d),
    deleteExpense: (id) => removeEntity("expenses", setExpenses, id),

    services,
    addService: (d) => addEntity("services", setServices, d),
    updateService: (id, d) => updateEntity("services", setServices, id, d),
    deleteService: (id) => removeEntity("services", setServices, id),

    getClientName: (id) => clients.find((c) => c.id === id)?.name ?? "—",
    getProjectName: (id) => projects.find((p) => p.id === id)?.name ?? "—",
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
