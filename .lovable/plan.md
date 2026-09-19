# Gwero OS — full module build-out

Grow the current CRM (prospects, campaigns, replies, clients, deals, agreements) into Gwero OS: an MSP business-operations suite with 18 modules, built on the existing MySQL schema and the same page style.

## Navigation

The sidebar becomes grouped instead of one flat list:

```text
Overview     Dashboard
Sales        Clients · Campaigns · Replies · Deals · Quotations · Cost sheets · Marketing
Bidding      Bids · EOI / Prequalification · RFPs · RFQs
Delivery     Projects · Jobs · Tasks & Activities · Procurement
People       Recruitment · HR · Payroll
Business     Documents · Finance & Accounts · Agreements & SLAs · Sending accounts
```

## What each module does

- **Quotations** — quote per client (optionally from a deal), line items with qty/unit price/tax, totals, status (draft, sent, accepted, rejected), validity date, convert an accepted quote into a project or job.
- **Cost sheets** — internal costing behind a quote or bid: cost lines (labour, hardware, licence, travel), markup per line, computed cost vs. sell vs. margin %.
- **Projects** — project per client, dates, budget, status, progress, manager; linked tasks, jobs, documents and costs.
- **Jobs** — smaller once-off/field work: client, job type, assignee, scheduled date, priority, status, completion notes.
- **Tasks & Activities** — task list with owner, due date, priority, status; attachable to any record (client, deal, project, bid). Also the timeline of notes/calls/meetings.
- **Procurement** — purchase requests and purchase orders: supplier, items, quantities, prices, expected delivery, approval and receipt status. Includes a suppliers list.
- **Bids** — tender tracker: reference, buyer, submission deadline, bond/security, status (identified, preparing, submitted, won, lost), value, linked cost sheet and documents.
- **EOI / Prequalification** — registration and prequalification submissions with buyer, category, validity, outcome.
- **RFPs** / **RFQs** — inbound requests: issuer, scope, deadline, our response status, linked quotation or bid.
- **Marketing** — campaign-level marketing plan: activities/channels, budget, spend, leads produced, period; sits above the emailing module.
- **Client sourcing (Campaigns)** — existing email campaign engine, kept as-is under Sales.
- **Clients** — existing module, extended with tabs for the records that now link to a client.
- **Documents** — central file library with title, category, owner, version, expiry (certificates, licences) and a link to any record.
- **Recruitment** — vacancies and applicants with stage tracking (applied, screened, interview, offer, hired/rejected).
- **HR** — employee register (role, department, employment type, start date, status), leave requests with balances.
- **Payroll** — pay runs per period with per-employee lines: gross, allowances, deductions, tax, net; run totals and status.
- **Finance & Accounts** — invoices (client, quote/project link, due date, status, paid amount), expenses, payments; a summary of revenue, receivables and spend.

## Technical approach

- **Schema**: append new tables to `database/schema.sql` in the same MySQL style (CHAR(36) ids, `created_at`/`updated_at`, FKs with ON DELETE SET NULL/CASCADE). Run through `bun run db:migrate`.
- **Data access**: extend the `fields` map in `src/lib/db.server.ts` and the interfaces in `src/lib/db.types.ts` for every new table, so the existing `db.from(...)` query layer works unchanged.
- **UI**: one route file per module under `src/routes/`, with detail routes (`quotations.$id`, `projects.$id`, `bids.$id`, `payroll.$id`) where line items or child records exist. Reuse `AppShell`, `money()` and the existing card/table/dialog patterns; no new UI library.
- **Shared pieces**: a small reusable list-page scaffold (search + filter + create dialog + table), a line-items editor shared by quotations, cost sheets, procurement orders and payroll runs, and a task/activity panel that can attach to any entity.
- Each route gets its own `head()` metadata.

## Delivery order

1. Schema + types + nav regrouping for all modules.
2. Sales: quotations, cost sheets, marketing.
3. Bidding: bids, EOI/prequalification, RFPs, RFQs.
4. Delivery: projects, jobs, tasks/activities, procurement.
5. People: recruitment, HR, payroll.
6. Business: documents, finance & accounts.
7. Dashboard rollup across all modules and a pass over existing pages for consistency.

## Notes

- Everything stays in the single shared workspace with no logins, matching the current app.
- Payroll calculations use simple entered figures (gross, allowances, deductions, tax) rather than country-specific tax rules unless you give me the rules to apply.
- This is a large build; I will work through the phases in order and report progress as each lands.
