-- ═══════════════════════════════════════════════════════════════
--  IMAGINE BUSINESS HUB — SUPABASE DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────
--  1. TABLES
-- ───────────────────────────────────────────────────

-- SERVICES (master templates)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Monthly', 'One-Time')) NOT NULL,
  "defaultQuantity" INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  "taskTemplate" JSONB NOT NULL DEFAULT '{"tasks":[]}'::jsonb,
  "createdAt" TEXT DEFAULT ''
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  "contactPerson" TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  email           TEXT DEFAULT '',
  address         TEXT DEFAULT '',
  "gstNumber"     TEXT DEFAULT '',
  industry        TEXT DEFAULT '',
  status          TEXT DEFAULT 'Active',
  notes           TEXT DEFAULT '',
  "createdAt"     TEXT DEFAULT ''
);

-- PROPOSALS
CREATE TABLE IF NOT EXISTS proposals (
  id                TEXT PRIMARY KEY,
  "proposalNumber"  TEXT DEFAULT '',
  "clientId"        TEXT DEFAULT '',
  date              TEXT DEFAULT '',
  "validUntil"      TEXT DEFAULT '',
  "projectType"     TEXT DEFAULT 'One-Time',
  items             JSONB DEFAULT '[]'::jsonb,
  "totalAmount"     NUMERIC DEFAULT 0,
  terms             TEXT DEFAULT '',
  status            TEXT CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected')) DEFAULT 'Draft',
  notes             TEXT DEFAULT '',
  "createdAt"       TEXT DEFAULT ''
);

-- PROPOSAL_SERVICES (junction table)
CREATE TABLE IF NOT EXISTS proposal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "proposalId" TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  "serviceId" TEXT NOT NULL,
  "serviceName" TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  type TEXT CHECK (type IN ('Monthly', 'One-Time')) NOT NULL,
  "createdAt" TEXT DEFAULT '',
  UNIQUE ("proposalId", "serviceId")
);

-- PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL DEFAULT '',
  "clientId"      TEXT DEFAULT '',
  type            TEXT DEFAULT 'One-Time',
  "startDate"     TEXT DEFAULT '',
  "endDate"       TEXT DEFAULT '',
  owner           TEXT DEFAULT '',
  status          TEXT DEFAULT 'Planning',
  "billingValue"  NUMERIC DEFAULT 0,
  "proposalId"    TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  "createdAt"     TEXT DEFAULT ''
);

-- DELIVERABLES
CREATE TABLE IF NOT EXISTS deliverables (
  id                  TEXT PRIMARY KEY,
  "projectId"         TEXT DEFAULT '',
  "serviceName"       TEXT DEFAULT '',
  "totalQuantity"     NUMERIC DEFAULT 0,
  "completedQuantity" NUMERIC DEFAULT 0,
  type                TEXT CHECK (type IN ('Monthly', 'One-Time')) DEFAULT 'One-Time',
  status              TEXT DEFAULT 'Planned',
  notes               TEXT DEFAULT ''
);

-- TASKS (grouped tasks with progress)
CREATE TABLE IF NOT EXISTS tasks (
  id                   TEXT PRIMARY KEY,
  "projectId"          TEXT DEFAULT '',
  "deliverableId"      TEXT DEFAULT '',
  title                TEXT DEFAULT '',
  assignee             TEXT DEFAULT '',
  priority             TEXT DEFAULT 'Medium',
  "dueDate"            TEXT DEFAULT '',
  status               TEXT CHECK (status IN ('Todo', 'In Progress', 'Review', 'Done', 'Blocked')) DEFAULT 'Todo',
  notes                TEXT DEFAULT '',
  "progressTotal"      NUMERIC DEFAULT 0,
  "progressCompleted"  NUMERIC DEFAULT 0
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id                TEXT PRIMARY KEY,
  "invoiceNumber"   TEXT DEFAULT '',
  "clientId"        TEXT DEFAULT '',
  "projectId"       TEXT DEFAULT '',
  "billingPeriod"   TEXT DEFAULT '',
  "issueDate"       TEXT DEFAULT '',
  "dueDate"         TEXT DEFAULT '',
  items             JSONB DEFAULT '[]'::jsonb,
  subtotal          NUMERIC DEFAULT 0,
  "gstPercent"      NUMERIC DEFAULT 18,
  "gstAmount"       NUMERIC DEFAULT 0,
  discount          NUMERIC DEFAULT 0,
  total             NUMERIC DEFAULT 0,
  status            TEXT DEFAULT 'Draft',
  "paymentDate"     TEXT DEFAULT '',
  notes             TEXT DEFAULT '',
  "createdAt"       TEXT DEFAULT ''
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id                TEXT PRIMARY KEY,
  date              TEXT DEFAULT '',
  category          TEXT DEFAULT '',
  amount            NUMERIC DEFAULT 0,
  type              TEXT DEFAULT 'Variable',
  "projectId"       TEXT DEFAULT '',
  vendor            TEXT DEFAULT '',
  notes             TEXT DEFAULT '',
  "paymentStatus"   TEXT DEFAULT 'Pending',
  "createdAt"       TEXT DEFAULT ''
);

-- ───────────────────────────────────────────────────
--  2. DISABLE RLS
-- ───────────────────────────────────────────────────

ALTER TABLE services          DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients           DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals         DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects          DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables      DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks             DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          DISABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────
--  3. ENABLE REALTIME
-- ───────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_services;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;