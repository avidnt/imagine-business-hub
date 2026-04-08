export type ClientRecord = {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  industry: string;
  billingType: string;
  budget: string;
  notes: string;
  status: string;
};

export type ProjectRecord = {
  id: number;
  name: string;
  client: string;
  type: "Monthly" | "One-Time";
  deliverables: string;
  billingValue: string;
  timeline: string;
  owner: string;
  status: "Planning" | "In Progress" | "Review" | "Completed";
  notes: string;
};

export type DeliverableRecord = {
  id: number;
  projectId: number;
  projectName: string;
  clientName: string;
  type: string;
  quantityPlanned: number;
  quantityCompleted: number;
  unit: "Reels" | "Posts" | "Stories" | "Edits" | "Designs" | "Other";
  dueCycle: string;
  status: "Planned" | "In Progress" | "Blocked" | "Completed";
  notes: string;
};

export type InvoiceRecord = {
  id: number;
  invoiceNumber: string;
  clientName: string;
  projectName: string;
  lineItems: Array<{
    description: string;
    amount: number;
  }>;
  gstPercent: number;
  dueDate: string;
  notes: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
};

export type TaskRecord = {
  id: number;
  projectId: number;
  projectName: string;
  deliverableId: number;
  deliverableName: string;
  assignee: string;
  title: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  status: "Todo" | "In Progress" | "Review" | "Done" | "Blocked";
  notes: string;
};

export const defaultClients: ClientRecord[] = [
  {
    id: 1,
    name: "ABC Builders",
    contact: "Anand Kumar",
    phone: "+91 98765 21001",
    email: "anand@abcbuilders.in",
    industry: "Real Estate",
    billingType: "Monthly Retainer",
    budget: "Rs 25,000 / month",
    notes: "Handles monthly content and campaign creatives.",
    status: "Active",
  },
  {
    id: 2,
    name: "Urban Cafe",
    contact: "Nisha Thomas",
    phone: "+91 98765 21002",
    email: "nisha@urbancafe.in",
    industry: "Food and Hospitality",
    billingType: "Monthly Retainer",
    budget: "Rs 18,000 / month",
    notes: "Needs reels, ad creatives, and monthly promotions.",
    status: "Active",
  },
  {
    id: 3,
    name: "Election Campaign Team",
    contact: "Rahul Menon",
    phone: "+91 98765 21003",
    email: "rahul@campaignoffice.in",
    industry: "Political Campaign",
    billingType: "One-Time Project",
    budget: "Rs 40,000 project",
    notes: "Campaign planning and rapid-turnaround design work.",
    status: "Proposal Stage",
  },
];

export const defaultProjects: ProjectRecord[] = [
  {
    id: 1,
    name: "ABC Builders Retainer",
    client: "ABC Builders",
    type: "Monthly",
    deliverables: "8 reels, 12 posts, 10 stories",
    billingValue: "Rs 25,000 / month",
    timeline: "Every month",
    owner: "Anand",
    status: "In Progress",
    notes: "Recurring real estate content and campaign creatives.",
  },
  {
    id: 2,
    name: "Urban Cafe Content Plan",
    client: "Urban Cafe",
    type: "Monthly",
    deliverables: "6 reels, 8 posts, ad creatives",
    billingValue: "Rs 18,000 / month",
    timeline: "Every month",
    owner: "Nisha",
    status: "Review",
    notes: "Includes ad management and monthly festival promotions.",
  },
  {
    id: 3,
    name: "District Election Campaign",
    client: "Election Campaign Team",
    type: "One-Time",
    deliverables: "Posters, field video, speech edits",
    billingValue: "Rs 40,000 project",
    timeline: "Apr 10 - May 05",
    owner: "Rahul",
    status: "Planning",
    notes: "Fast-turnaround creative support with field updates.",
  },
];

export const defaultDeliverables: DeliverableRecord[] = [
  {
    id: 1,
    projectId: 1,
    projectName: "ABC Builders Retainer",
    clientName: "ABC Builders",
    type: "Monthly Content Batch",
    quantityPlanned: 8,
    quantityCompleted: 3,
    unit: "Reels",
    dueCycle: "April 2026",
    status: "In Progress",
    notes: "Site visit footage pending for final 2 reels.",
  },
  {
    id: 2,
    projectId: 2,
    projectName: "Urban Cafe Content Plan",
    clientName: "Urban Cafe",
    type: "Festival Campaign Assets",
    quantityPlanned: 10,
    quantityCompleted: 6,
    unit: "Designs",
    dueCycle: "Apr 20",
    status: "In Progress",
    notes: "Need client approval on offer creatives.",
  },
  {
    id: 3,
    projectId: 3,
    projectName: "District Election Campaign",
    clientName: "Election Campaign Team",
    type: "Speech Video Edits",
    quantityPlanned: 5,
    quantityCompleted: 0,
    unit: "Edits",
    dueCycle: "Week 2",
    status: "Planned",
    notes: "Awaiting first set of raw speeches.",
  },
];

export const defaultInvoices: InvoiceRecord[] = [
  {
    id: 1,
    invoiceNumber: "INV-001",
    clientName: "ABC Builders",
    projectName: "ABC Builders Retainer",
    lineItems: [
      { description: "Monthly social media retainer", amount: 20000 },
      { description: "Ad creative pack", amount: 5000 },
    ],
    gstPercent: 18,
    dueDate: "2026-04-15",
    notes: "Payment expected within 7 days of invoice issue.",
    status: "Sent",
  },
  {
    id: 2,
    invoiceNumber: "INV-002",
    clientName: "Urban Cafe",
    projectName: "Urban Cafe Content Plan",
    lineItems: [
      { description: "Monthly content production", amount: 18000 },
    ],
    gstPercent: 18,
    dueDate: "2026-04-18",
    notes: "Includes campaign optimization support.",
    status: "Draft",
  },
];

export const defaultTasks: TaskRecord[] = [
  {
    id: 1,
    projectId: 1,
    projectName: "ABC Builders Retainer",
    deliverableId: 1,
    deliverableName: "Monthly Content Batch",
    assignee: "Anand",
    title: "Finalize reel hooks and captions",
    priority: "High",
    dueDate: "2026-04-12",
    status: "In Progress",
    notes: "Need final approval for 2 scripts before scheduling edits.",
  },
  {
    id: 2,
    projectId: 2,
    projectName: "Urban Cafe Content Plan",
    deliverableId: 2,
    deliverableName: "Festival Campaign Assets",
    assignee: "Nisha",
    title: "Prepare weekend offer design variants",
    priority: "Medium",
    dueDate: "2026-04-14",
    status: "Review",
    notes: "Send 3 visual options to client for final signoff.",
  },
  {
    id: 3,
    projectId: 3,
    projectName: "District Election Campaign",
    deliverableId: 3,
    deliverableName: "Speech Video Edits",
    assignee: "Rahul",
    title: "Ingest and label rally footage",
    priority: "Urgent",
    dueDate: "2026-04-10",
    status: "Todo",
    notes: "Raw files expected from ground team by evening.",
  },
];
