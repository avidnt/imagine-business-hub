-- ═══════════════════════════════════════════════════════════════
--  IMAGINE BUSINESS HUB — SUPABASE DATABASE SCHEMA
--  Run this entire script in the Supabase SQL Editor
--  Dashboard → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────
--  1. TABLES
-- ───────────────────────────────────────────────────

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
  type                TEXT DEFAULT '',
  "quantityPlanned"   NUMERIC DEFAULT 0,
  "quantityCompleted" NUMERIC DEFAULT 0,
  unit                TEXT DEFAULT '',
  "dueCycle"          TEXT DEFAULT '',
  status              TEXT DEFAULT 'Planned',
  notes               TEXT DEFAULT ''
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,
  "projectId"     TEXT DEFAULT '',
  "deliverableId" TEXT DEFAULT '',
  title           TEXT DEFAULT '',
  assignee        TEXT DEFAULT '',
  priority        TEXT DEFAULT 'Medium',
  "dueDate"       TEXT DEFAULT '',
  status          TEXT DEFAULT 'Todo',
  notes           TEXT DEFAULT ''
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
  status            TEXT DEFAULT 'Draft',
  notes             TEXT DEFAULT '',
  "createdAt"       TEXT DEFAULT ''
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
--  2. DISABLE ROW LEVEL SECURITY (internal tool, no auth)
-- ───────────────────────────────────────────────────

ALTER TABLE clients      DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects     DISABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks        DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposals    DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     DISABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────
--  3. ENABLE REALTIME (so all users see live updates)
-- ───────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE clients;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;


-- ───────────────────────────────────────────────────
--  4. SEED DATA (sample data to get started)
-- ───────────────────────────────────────────────────

-- Clients
INSERT INTO clients (id, name, "contactPerson", phone, email, address, "gstNumber", industry, status, notes, "createdAt") VALUES
  ('c1', 'ABC Builders',            'Anand Kumar',  '+91 98765 21001', 'anand@abcbuilders.in',    '14 MG Road, Kochi',                '32AABCU9603R1ZM', 'Real Estate',        'Active',         'Monthly retainer client for social media.',       '2026-01-15'),
  ('c2', 'Urban Cafe',              'Nisha Thomas', '+91 98765 21002', 'nisha@urbancafe.in',      '7 Church Street, Bangalore',       '29AADCB2230M1Z5', 'Food & Hospitality', 'Active',         'Needs reels, ad creatives, and monthly promotions.', '2026-02-01'),
  ('c3', 'Election Campaign Team',  'Rahul Menon',  '+91 98765 21003', 'rahul@campaignoffice.in', 'Constituency Office, Trivandrum',  '',                'Political Campaign', 'Proposal Stage', 'One-time campaign with tight deadlines.',          '2026-03-20'),
  ('c4', 'FitZone Gym',             'Priya Sharma', '+91 98765 21004', 'priya@fitzone.in',        '22 Park Avenue, Mumbai',           '27AAACR5055K1Z8', 'Fitness & Wellness', 'Active',         'Summer campaign for new branch openings.',         '2026-03-01'),
  ('c5', 'Skyline Developers',      'Vikram Patel', '+91 98765 21005', 'vikram@skylinedev.in',    'Tower B, Hitech City, Hyderabad',  '36AABCS1429B1ZV', 'Real Estate',        'Active',         'New lead — interested in branding package.',       '2026-04-01');

-- Projects
INSERT INTO projects (id, name, "clientId", type, "startDate", "endDate", owner, status, "billingValue", "proposalId", notes, "createdAt") VALUES
  ('p1', 'ABC Builders Monthly Retainer', 'c1', 'Monthly',  '2026-01-15', '',           'Anand', 'In Progress', 25000, 'pr1', 'Recurring real-estate content and campaign creatives.', '2026-01-15'),
  ('p2', 'Urban Cafe Content Plan',       'c2', 'Monthly',  '2026-02-01', '',           'Nisha', 'Review',      18000, '',    'Includes ad management and monthly festival promotions.', '2026-02-01'),
  ('p3', 'District Election Campaign',    'c3', 'One-Time', '2026-04-10', '2026-05-05', 'Rahul', 'Planning',    80000, 'pr2', 'Fast-turnaround creative support with field updates.',  '2026-03-25'),
  ('p4', 'FitZone Summer Campaign',       'c4', 'One-Time', '2026-04-01', '2026-05-31', 'Priya', 'In Progress', 35000, 'pr3', 'Promo reels and social content for new branches.',      '2026-04-01');

-- Deliverables
INSERT INTO deliverables (id, "projectId", type, "quantityPlanned", "quantityCompleted", unit, "dueCycle", status, notes) VALUES
  ('d1', 'p1', 'Monthly Reels',    8,  3, 'Reels',   'April 2026', 'In Progress', 'Site visit footage pending for final 2 reels.'),
  ('d2', 'p1', 'Static Posts',     12, 7, 'Posts',   'April 2026', 'In Progress', 'Need final copy approval on 3 posts.'),
  ('d3', 'p1', 'Stories',          10, 5, 'Stories', 'April 2026', 'In Progress', ''),
  ('d4', 'p2', 'Reels',             6, 4, 'Reels',   'April 2026', 'In Progress', 'Need client approval on offer creatives.'),
  ('d5', 'p2', 'Ad Creatives',      4, 2, 'Designs', 'April 2026', 'In Progress', ''),
  ('d6', 'p3', 'Poster Creatives', 25, 0, 'Designs', 'Week 2',     'Planned',     'Awaiting brand guidelines from client.'),
  ('d7', 'p3', 'Campaign Reels',   10, 0, 'Reels',   'Week 3',     'Planned',     ''),
  ('d8', 'p4', 'Promo Reels',       6, 2, 'Reels',   'May 2026',   'In Progress', '');

-- Tasks
INSERT INTO tasks (id, "projectId", "deliverableId", title, assignee, priority, "dueDate", status, notes) VALUES
  ('t1', 'p1', 'd1', 'Finalize reel hooks and captions', 'Anand', 'High',   '2026-04-12', 'In Progress', 'Need approval for 2 scripts.'),
  ('t2', 'p1', 'd2', 'Design social post templates',     'Nisha', 'Medium', '2026-04-14', 'Todo',        ''),
  ('t3', 'p2', 'd4', 'Edit weekend offer reel',          'Priya', 'Medium', '2026-04-13', 'Review',      'Send 3 visual options for signoff.'),
  ('t4', 'p3', 'd6', 'Ingest and label rally footage',   'Rahul', 'Urgent', '2026-04-10', 'Todo',        'Raw files expected from ground team.'),
  ('t5', 'p3', 'd6', 'Design poster templates',          'Anand', 'High',   '2026-04-11', 'In Progress', ''),
  ('t6', 'p4', 'd8', 'Plan gym shoot sessions',          'Priya', 'Medium', '2026-04-15', 'Todo',        'Coordinate with 3 branch managers.');

-- Proposals
INSERT INTO proposals (id, "proposalNumber", "clientId", date, "validUntil", "projectType", items, "totalAmount", terms, status, notes, "createdAt") VALUES
  ('pr1', 'PR-001', 'c1', '2026-01-10', '2026-01-25', 'Monthly Retainer',
   '[{"description":"Monthly Social Media Management","quantity":1,"unit":"month","rate":20000,"amount":20000},{"description":"Ad Creative Pack","quantity":1,"unit":"pack","rate":5000,"amount":5000}]'::jsonb,
   25000, 'Payment within 7 days of invoice.', 'Approved', 'Converted to project.', '2026-01-10'),
  ('pr2', 'PR-002', 'c3', '2026-03-22', '2026-04-05', 'One-Time',
   '[{"description":"25 Poster Creatives","quantity":25,"unit":"poster","rate":1200,"amount":30000},{"description":"10 Campaign Reels","quantity":10,"unit":"reel","rate":3000,"amount":30000},{"description":"Field Coverage (2 days)","quantity":2,"unit":"day","rate":10000,"amount":20000}]'::jsonb,
   80000, '50% advance, 50% on completion.', 'Sent', 'Awaiting client decision.', '2026-03-22'),
  ('pr3', 'PR-003', 'c4', '2026-03-28', '2026-04-10', 'One-Time',
   '[{"description":"6 Promo Reels","quantity":6,"unit":"reel","rate":3500,"amount":21000},{"description":"Social Media Content","quantity":1,"unit":"package","rate":14000,"amount":14000}]'::jsonb,
   35000, 'Full payment on delivery.', 'Draft', '', '2026-03-28');

-- Invoices
INSERT INTO invoices (id, "invoiceNumber", "clientId", "projectId", "billingPeriod", "issueDate", "dueDate", items, subtotal, "gstPercent", "gstAmount", total, status, "paymentDate", notes, "createdAt") VALUES
  ('inv1', 'INV-001', 'c1', 'p1', 'March 2026', '2026-04-01', '2026-04-15',
   '[{"description":"Monthly social media retainer","amount":20000},{"description":"Ad creative pack","amount":5000}]'::jsonb,
   25000, 18, 4500, 29500, 'Sent', '', 'Payment expected within 7 days.', '2026-04-01'),
  ('inv2', 'INV-002', 'c2', 'p2', 'March 2026', '2026-04-02', '2026-04-18',
   '[{"description":"Monthly content production","amount":18000}]'::jsonb,
   18000, 18, 3240, 21240, 'Draft', '', 'Includes campaign optimization support.', '2026-04-02'),
  ('inv3', 'INV-003', 'c3', 'p3', 'April 2026', '2026-04-05', '2026-04-20',
   '[{"description":"Election campaign — 50% advance","amount":40000}]'::jsonb,
   40000, 18, 7200, 47200, 'Sent', '', 'Balance on completion.', '2026-04-05');

-- Expenses
INSERT INTO expenses (id, date, category, amount, type, "projectId", vendor, notes, "paymentStatus", "createdAt") VALUES
  ('exp1', '2026-04-01', 'Salaries',    120000, 'Fixed',    '',   'Payroll',              'April staff salaries.',            'Paid',    '2026-04-01'),
  ('exp2', '2026-04-01', 'Software',      5000, 'Fixed',    '',   'Adobe',                'Creative Cloud subscription.',     'Paid',    '2026-04-01'),
  ('exp3', '2026-04-01', 'Rent',         15000, 'Fixed',    '',   'Landlord',             'Office rent.',                     'Paid',    '2026-04-01'),
  ('exp4', '2026-04-05', 'Freelancers',   8000, 'Variable', '',   'Arun (Video Editor)',  'Freelance editing for April batch.','Pending', '2026-04-05'),
  ('exp5', '2026-04-03', 'Printing',     12000, 'Project',  'p3', 'PrintWorks',           'Election poster printing.',        'Paid',    '2026-04-03'),
  ('exp6', '2026-04-04', 'Travel',        3000, 'Variable', '',   'Self',                 'Client visit travel.',             'Paid',    '2026-04-04');


-- ═══════════════════════════════════════════════════════════════
--  ✅ DONE! Your database is ready.
-- ═══════════════════════════════════════════════════════════════
