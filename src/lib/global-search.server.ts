import type { RowDataPacket } from "mysql2/promise";
import type { GlobalSearchGroup, GlobalSearchResult } from "./global-search.types";

type CandidateRow = RowDataPacket & {
  id: string;
  parent_id: string | null;
  title: string | null;
  subtitle: string | null;
  search_text: string | null;
  meta: string | null;
  updated_at: string | Date | null;
};

type SearchSpec = {
  kind: string;
  group: GlobalSearchGroup;
  typeLabel: string;
  table: string;
  title: string;
  subtitle: string;
  search: string;
  meta: string;
  updatedAt?: string;
  parentId?: string;
  intents: string[];
  url: (row: CandidateRow, query: string) => string;
  extraWhere?: string;
};

const listUrl = (path: string, query: string) => `${path}?search=${encodeURIComponent(query)}`;

const SPECS: SearchSpec[] = [
  {
    kind: "client",
    group: "Relationships",
    typeLabel: "Client",
    table: "clients",
    title: "name",
    subtitle: "CONCAT_WS(' · ', NULLIF(company, ''), NULLIF(email, ''), NULLIF(industry, ''))",
    search: "CONCAT_WS(' ', name, company, email, phone, website, industry, address, notes)",
    meta: "status",
    intents: ["client"],
    url: (row) => `/clients/${row.id}`,
  },
  {
    kind: "client_contact",
    group: "People",
    typeLabel: "Client contact",
    table: "client_contacts",
    title:
      "COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), NULLIF(email, ''), 'Client contact')",
    subtitle: "CONCAT_WS(' · ', NULLIF(job_title, ''), NULLIF(email, ''), NULLIF(location, ''))",
    search: "CONCAT_WS(' ', first_name, last_name, email, phone, raw_phone, job_title, location)",
    meta: "IF(is_primary, 'Primary contact', 'Contact')",
    parentId: "client_id",
    intents: ["person", "client"],
    url: (row) => `/clients/${row.parent_id}`,
  },
  {
    kind: "prospect",
    group: "Relationships",
    typeLabel: "Prospect",
    table: "prospects",
    title:
      "COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), NULLIF(company, ''), email)",
    subtitle: "CONCAT_WS(' · ', NULLIF(company, ''), NULLIF(email, ''), NULLIF(job_title, ''))",
    search:
      "CONCAT_WS(' ', first_name, last_name, company, email, phone, job_title, website, industry, address, city, country, notes)",
    meta: "status",
    intents: ["prospect", "person"],
    url: (row) => `/prospects/${row.id}`,
  },
  {
    kind: "prospect_contact",
    group: "People",
    typeLabel: "Prospect contact",
    table: "prospect_contacts",
    title:
      "COALESCE(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), NULLIF(email, ''), 'Prospect contact')",
    subtitle: "CONCAT_WS(' · ', NULLIF(job_title, ''), NULLIF(email, ''), NULLIF(location, ''))",
    search: "CONCAT_WS(' ', first_name, last_name, email, phone, raw_phone, job_title, location)",
    meta: "IF(is_primary, 'Primary contact', 'Contact')",
    parentId: "prospect_id",
    intents: ["person", "prospect"],
    url: (row) => `/prospects/${row.parent_id}/contacts/${row.id}`,
  },
  {
    kind: "employee",
    group: "People",
    typeLabel: "Employee",
    table: "employees",
    title: "full_name",
    subtitle: "CONCAT_WS(' · ', NULLIF(job_title, ''), NULLIF(department, ''), NULLIF(email, ''))",
    search:
      "CONCAT_WS(' ', full_name, employee_number, email, phone, job_title, department, notes)",
    meta: "status",
    intents: ["person", "employee"],
    url: (row, query) => listUrl("/hr", String(row.title || query)),
  },
  {
    kind: "bid",
    group: "Opportunities",
    typeLabel: "Bid",
    table: "bids",
    title: "title",
    subtitle: "CONCAT_WS(' · ', NULLIF(reference, ''), NULLIF(buyer, ''))",
    search: "CONCAT_WS(' ', title, reference, buyer, status, notes)",
    meta: "status",
    intents: ["bid", "opportunity"],
    url: (row) => `/bids/${row.id}`,
  },
  {
    kind: "eoi",
    group: "Opportunities",
    typeLabel: "EOI / Prequalification",
    table: "prequalifications",
    title: "COALESCE(NULLIF(title, ''), buyer)",
    subtitle: "CONCAT_WS(' · ', NULLIF(reference, ''), NULLIF(buyer, ''), NULLIF(category, ''))",
    search:
      "CONCAT_WS(' ', title, reference, buyer, category, submission_type, status, outcome, notes)",
    meta: "status",
    intents: ["eoi", "opportunity"],
    url: (row) => `/prequalifications/${row.id}`,
  },
  {
    kind: "rfp",
    group: "Opportunities",
    typeLabel: "RFP",
    table: "requests",
    title: "title",
    subtitle: "CONCAT_WS(' · ', NULLIF(reference, ''), NULLIF(issuer, ''))",
    search: "CONCAT_WS(' ', title, reference, issuer, status, scope, notes)",
    meta: "status",
    intents: ["rfp", "opportunity"],
    extraWhere: "request_type = 'rfp'",
    url: (row) => `/rfps/${row.id}`,
  },
  {
    kind: "rfq",
    group: "Opportunities",
    typeLabel: "RFQ",
    table: "requests",
    title: "title",
    subtitle: "CONCAT_WS(' · ', NULLIF(reference, ''), NULLIF(issuer, ''))",
    search: "CONCAT_WS(' ', title, reference, issuer, status, scope, notes)",
    meta: "status",
    intents: ["rfq", "opportunity"],
    extraWhere: "request_type = 'rfq'",
    url: (row) => `/rfqs/${row.id}`,
  },
  {
    kind: "project",
    group: "Work",
    typeLabel: "Project",
    table: "projects",
    title: "name",
    subtitle: "CONCAT_WS(' · ', NULLIF(code, ''), NULLIF(manager, ''))",
    search: "CONCAT_WS(' ', name, code, manager, status, description)",
    meta: "status",
    intents: ["project"],
    url: (row, query) => listUrl("/projects", String(row.title || query)),
  },
  {
    kind: "job",
    group: "Work",
    typeLabel: "Job",
    table: "jobs",
    title: "title",
    subtitle: "CONCAT_WS(' · ', NULLIF(job_type, ''), NULLIF(assignee, ''))",
    search: "CONCAT_WS(' ', title, job_type, assignee, priority, status, notes)",
    meta: "status",
    intents: ["job"],
    url: (row, query) => listUrl("/jobs", String(row.title || query)),
  },
  {
    kind: "task",
    group: "Work",
    typeLabel: "Task",
    table: "tasks",
    title: "title",
    subtitle: "CONCAT_WS(' · ', NULLIF(entity_type, ''), NULLIF(assignee, ''))",
    search: "CONCAT_WS(' ', title, entity_type, assignee, priority, status, notes)",
    meta: "status",
    intents: ["task"],
    url: (row, query) => listUrl("/tasks", String(row.title || query)),
  },
  {
    kind: "document",
    group: "Documents & finance",
    typeLabel: "Document",
    table: "documents",
    title: "title",
    subtitle: "CONCAT_WS(' · ', NULLIF(category, ''), NULLIF(owner, ''), NULLIF(version, ''))",
    search: "CONCAT_WS(' ', title, category, entity_type, owner, version, notes)",
    meta: "category",
    intents: ["document"],
    url: (row, query) => listUrl("/documents", String(row.title || query)),
  },
  {
    kind: "quotation",
    group: "Documents & finance",
    typeLabel: "Quotation",
    table: "quotations",
    title: "title",
    subtitle: "quote_number",
    search: "CONCAT_WS(' ', title, quote_number, status, currency, notes)",
    meta: "status",
    intents: ["quotation"],
    url: (row) => `/quotations/${row.id}`,
  },
  {
    kind: "cost_sheet",
    group: "Documents & finance",
    typeLabel: "Cost sheet",
    table: "cost_sheets",
    title: "name",
    subtitle: "CONCAT_WS(' · ', status, currency)",
    search: "CONCAT_WS(' ', name, status, currency, notes)",
    meta: "status",
    intents: ["cost_sheet"],
    url: (row) => `/cost-sheets/${row.id}`,
  },
  {
    kind: "deal",
    group: "Relationships",
    typeLabel: "Deal",
    table: "deals",
    title: "title",
    subtitle: "CONCAT_WS(' · ', stage, owner)",
    search: "CONCAT_WS(' ', title, stage, owner, currency, notes)",
    meta: "stage",
    intents: ["deal"],
    url: (row, query) => listUrl("/deals", String(row.title || query)),
  },
  {
    kind: "agreement",
    group: "Documents & finance",
    typeLabel: "Agreement / SLA",
    table: "agreements",
    title: "title",
    subtitle: "CONCAT_WS(' · ', agreement_type, billing_cycle)",
    search: "CONCAT_WS(' ', title, agreement_type, status, billing_cycle, coverage_hours, notes)",
    meta: "status",
    intents: ["agreement"],
    url: (row, query) => listUrl("/agreements", String(row.title || query)),
  },
  {
    kind: "campaign",
    group: "Communication",
    typeLabel: "Campaign",
    table: "campaigns",
    title: "name",
    subtitle: "subject",
    search: "CONCAT_WS(' ', name, subject, status, campaign_type, objective)",
    meta: "status",
    intents: ["campaign"],
    url: (row) => `/campaigns/${row.id}`,
  },
  {
    kind: "supplier",
    group: "Relationships",
    typeLabel: "Vendor",
    table: "suppliers",
    title: "name",
    subtitle: "CONCAT_WS(' · ', NULLIF(contact_name, ''), NULLIF(category, ''), NULLIF(email, ''))",
    search: "CONCAT_WS(' ', name, contact_name, email, phone, category, notes)",
    meta: "category",
    intents: ["vendor"],
    url: (row, query) => listUrl("/vendors", String(row.title || query)),
  },
  {
    kind: "vacancy",
    group: "People",
    typeLabel: "Vacancy",
    table: "vacancies",
    title: "title",
    subtitle: "CONCAT_WS(' · ', NULLIF(department, ''), NULLIF(location, ''))",
    search: "CONCAT_WS(' ', title, department, employment_type, status, location, description)",
    meta: "status",
    intents: ["recruitment"],
    url: (row, query) => listUrl("/recruitment", String(row.title || query)),
  },
];

const INTENT_WORDS: Record<string, string[]> = {
  client: ["client", "clients", "customer", "customers"],
  prospect: ["prospect", "prospects", "lead", "leads"],
  person: ["person", "people", "contact", "contacts"],
  employee: ["employee", "employees", "staff", "team"],
  recruitment: ["applicant", "applicants", "vacancy", "vacancies", "recruitment", "candidate"],
  opportunity: ["opportunity", "opportunities"],
  bid: ["bid", "bids", "tender", "tenders"],
  eoi: ["eoi", "prequalification", "prequalifications", "prequal"],
  rfp: ["rfp", "rfps", "proposal", "proposals"],
  rfq: ["rfq", "rfqs"],
  project: ["project", "projects"],
  job: ["job", "jobs"],
  task: ["task", "tasks", "activity", "activities"],
  document: ["document", "documents", "file", "files"],
  quotation: ["quotation", "quotations", "quote", "quotes"],
  cost_sheet: ["costsheet", "costsheets", "cost", "sheet", "sheets"],
  deal: ["deal", "deals", "sale", "sales"],
  agreement: ["agreement", "agreements", "contract", "contracts", "sla", "slas"],
  campaign: ["campaign", "campaigns", "email", "emails"],
  vendor: ["vendor", "vendors", "supplier", "suppliers"],
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parseSearchQuery(query: string) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean).slice(0, 8);
  const intents = new Set<string>();
  const terms = tokens.filter((token) => {
    const intent = Object.entries(INTENT_WORDS).find(([, aliases]) => aliases.includes(token))?.[0];
    if (!intent) return true;
    intents.add(intent);
    return false;
  });
  return { tokens, intents: [...intents], terms };
}

export function rankSearchCandidate(
  candidate: Pick<GlobalSearchResult, "kind" | "typeLabel" | "title" | "subtitle" | "meta"> & {
    searchText?: string;
  },
  query: string,
  intents: string[] = [],
) {
  const phrase = normalizeSearchText(query);
  const title = normalizeSearchText(candidate.title);
  const subtitle = normalizeSearchText(candidate.subtitle);
  const haystack = normalizeSearchText(
    `${candidate.title} ${candidate.subtitle} ${candidate.meta} ${candidate.typeLabel} ${candidate.searchText || ""}`,
  );
  const tokens = phrase.split(" ").filter(Boolean);
  let score = 0;
  if (title === phrase) score += 130;
  else if (title.startsWith(phrase)) score += 95;
  else if (title.includes(phrase)) score += 70;
  else if (subtitle.includes(phrase)) score += 45;
  else if (haystack.includes(phrase)) score += 25;
  let matched = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) continue;
    matched += 1;
    const titleWords = title.split(" ");
    if (titleWords.includes(token)) score += 22;
    else if (titleWords.some((word) => word.startsWith(token))) score += 16;
    else if (subtitle.includes(token)) score += 9;
    else score += 4;
  }
  score += tokens.length ? Math.round((matched / tokens.length) * 35) : 0;
  if (intents.includes(candidate.kind)) score += 45;
  return score;
}

async function rowsForSpec(spec: SearchSpec, terms: string[]) {
  const { getPool } = await import("./db.server");
  const normalizedSearch = `LOWER(${spec.search})`;
  const termWhere = terms.length
    ? `(${terms.map(() => `LOCATE(?, ${normalizedSearch}) > 0`).join(" OR ")})`
    : "1 = 1";
  const where = [spec.extraWhere, termWhere].filter(Boolean).join(" AND ");
  const [rows] = await getPool().execute(
    `SELECT id,
            ${spec.parentId || "NULL"} AS parent_id,
            ${spec.title} AS title,
            ${spec.subtitle} AS subtitle,
            ${spec.search} AS search_text,
            ${spec.meta} AS meta,
            ${spec.updatedAt || "updated_at"} AS updated_at
       FROM ${spec.table}
      WHERE ${where}
      ORDER BY ${spec.updatedAt || "updated_at"} DESC
      LIMIT 12`,
    terms,
  );
  return rows as CandidateRow[];
}

export async function searchEverywhereServer(query: string): Promise<GlobalSearchResult[]> {
  const cleanQuery = query.trim().slice(0, 120);
  if (normalizeSearchText(cleanQuery).length < 2) return [];
  const parsed = parseSearchQuery(cleanQuery);
  const selectedSpecs = parsed.intents.length
    ? SPECS.filter((spec) => spec.intents.some((intent) => parsed.intents.includes(intent)))
    : SPECS;
  const terms = parsed.terms;
  const batches = await Promise.all(
    selectedSpecs.map(async (spec) => ({ spec, rows: await rowsForSpec(spec, terms) })),
  );
  return batches
    .flatMap(({ spec, rows }) =>
      rows.map((row) => {
        const result = {
          id: row.id,
          kind: spec.kind,
          group: spec.group,
          typeLabel: spec.typeLabel,
          title: String(row.title || spec.typeLabel),
          subtitle: String(row.subtitle || ""),
          meta: String(row.meta || ""),
          url: spec.url(row, cleanQuery),
          score: 0,
        } satisfies GlobalSearchResult;
        result.score = rankSearchCandidate(
          { ...result, searchText: String(row.search_text || "") },
          parsed.terms.join(" ") || cleanQuery,
          parsed.intents,
        );
        return result;
      }),
    )
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 36);
}
