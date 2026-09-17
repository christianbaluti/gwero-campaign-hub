import { randomUUID } from "node:crypto";
import mysql, { type Pool } from "mysql2/promise";
import { createDb, type DbInput, type DbResult } from "./db-query";
import type { TableName } from "./db.types";

const fields: Record<TableName, string[]> = {
  prospects: [
    "id",
    "email",
    "first_name",
    "last_name",
    "company",
    "job_title",
    "phone",
    "status",
    "notes",
    "extra",
    "source_file",
    "created_at",
    "updated_at",
  ],
  clients: [
    "id",
    "name",
    "company",
    "email",
    "phone",
    "website",
    "industry",
    "status",
    "address",
    "notes",
    "prospect_id",
    "created_at",
    "updated_at",
  ],
  mailboxes: [
    "id",
    "name",
    "from_email",
    "from_name",
    "provider",
    "smtp_host",
    "smtp_port",
    "smtp_secure",
    "smtp_username",
    "imap_host",
    "imap_port",
    "imap_username",
    "is_default",
    "last_sync_at",
    "last_status",
    "created_at",
  ],
  mailbox_secrets: [
    "mailbox_id",
    "smtp_password",
    "imap_password",
    "oauth_access_token",
    "oauth_refresh_token",
    "oauth_expires_at",
    "updated_at",
  ],
  campaigns: [
    "id",
    "name",
    "subject",
    "body_html",
    "mailbox_id",
    "cc",
    "bcc",
    "attachments",
    "track_opens",
    "track_clicks",
    "status",
    "sent_at",
    "created_at",
    "updated_at",
  ],
  campaign_recipients: [
    "id",
    "campaign_id",
    "prospect_id",
    "status",
    "error",
    "message_id",
    "sent_at",
    "opened_at",
    "open_count",
    "clicked_at",
    "click_count",
    "replied_at",
    "created_at",
  ],
  deals: [
    "id",
    "title",
    "client_id",
    "prospect_id",
    "value",
    "currency",
    "stage",
    "probability",
    "expected_close_date",
    "owner",
    "notes",
    "created_at",
    "updated_at",
  ],
  agreements: [
    "id",
    "client_id",
    "deal_id",
    "title",
    "agreement_type",
    "status",
    "start_date",
    "end_date",
    "value",
    "currency",
    "billing_cycle",
    "response_time_hours",
    "resolution_time_hours",
    "coverage_hours",
    "auto_renew",
    "notes",
    "created_at",
    "updated_at",
  ],
  agreement_items: [
    "id",
    "agreement_id",
    "description",
    "quantity",
    "unit_price",
    "created_at",
    "updated_at",
  ],
  activities: [
    "id",
    "entity_type",
    "entity_id",
    "activity_type",
    "body",
    "occurred_at",
    "created_at",
    "updated_at",
  ],
  replies: [
    "id",
    "mailbox_id",
    "prospect_id",
    "campaign_id",
    "from_email",
    "subject",
    "snippet",
    "received_at",
    "external_id",
    "created_at",
  ],
};
const jsonFields: Record<string, string[]> = {
  prospects: ["extra"],
  campaigns: ["cc", "bcc", "attachments"],
};
const booleanFields: Record<string, string[]> = {
  mailboxes: ["smtp_secure", "is_default"],
  campaigns: ["track_opens", "track_clicks"],
  agreements: ["auto_renew"],
};
const publicTables = new Set<TableName>([
  "prospects",
  "clients",
  "mailboxes",
  "campaigns",
  "campaign_recipients",
  "deals",
  "agreements",
  "agreement_items",
  "activities",
  "replies",
]);
let pool: Pool | undefined;

export function getPool() {
  if (!pool) {
    const database = process.env["DB_NAME"] || "gwero_crm";
    if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error("Invalid DB_NAME");
    pool = mysql.createPool({
      database,
      user: process.env["DB_USER"] || process.env["USER"] || "root",
      password: process.env["DB_PASSWORD"] || "",
      ...(process.env["DB_SOCKET"] || (!process.env["DB_HOST"] && process.platform === "darwin")
        ? { socketPath: process.env["DB_SOCKET"] || "/tmp/mysql.sock" }
        : {
            host: process.env["DB_HOST"] || "127.0.0.1",
            port: Number(process.env["DB_PORT"] || 3306),
          }),
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
      decimalNumbers: true,
    });
  }
  return pool;
}

function assertColumn(table: TableName, column: string) {
  if (!fields[table].includes(column)) throw new Error(`Invalid ${table} column: ${column}`);
  return `\`${column}\``;
}
function decode(table: TableName, row: Record<string, unknown>) {
  const result = { ...row };
  for (const key of jsonFields[table] || [])
    if (typeof result[key] === "string") {
      try {
        result[key] = JSON.parse(result[key] as string);
      } catch {
        result[key] = null;
      }
    }
  for (const key of booleanFields[table] || [])
    if (key in result) result[key] = Boolean(result[key]);
  return result;
}
function encode(table: TableName, key: string, value: unknown) {
  if (value === undefined) return null;
  if (jsonFields[table]?.includes(key)) return JSON.stringify(value ?? (key === "extra" ? {} : []));
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && /^\d{4}-\d\d-\d\dT/.test(value))
    return value.replace("T", " ").replace(/Z$/, "").slice(0, 23);
  return value;
}
function where(input: DbInput) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const filter of input.filters) {
    const column = assertColumn(input.table, filter.column);
    if (filter.op === "eq") {
      clauses.push(filter.value === null ? `${column} IS NULL` : `${column} = ?`);
      if (filter.value !== null) params.push(filter.value);
    } else {
      const values = Array.isArray(filter.value) ? filter.value : [];
      clauses.push(values.length ? `${column} IN (${values.map(() => "?").join(",")})` : "FALSE");
      params.push(...values);
    }
  }
  return { sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
}
async function rows(table: TableName, clause: string, params: unknown[] = []) {
  const [result] = await getPool().execute(
    `SELECT * FROM \`${table}\`${clause}`,
    params as never[],
  );
  return (result as Array<Record<string, unknown>>).map((row) => decode(table, row));
}
async function enrich(table: TableName, input: DbInput, selected: Array<Record<string, unknown>>) {
  const projection = input.columns || "";
  if (table === "campaigns" && projection.includes("campaign_recipients(")) {
    for (const row of selected)
      row["campaign_recipients"] = await rows("campaign_recipients", " WHERE campaign_id = ?", [
        row["id"],
      ]);
  }
  if (table === "campaign_recipients" && projection.includes("prospects(")) {
    for (const row of selected)
      row["prospects"] =
        (await rows("prospects", " WHERE id = ? LIMIT 1", [row["prospect_id"]]))[0] || null;
  }
  if ((table === "deals" || table === "agreements") && projection.includes("clients(")) {
    for (const row of selected)
      row["clients"] = row["client_id"]
        ? (await rows("clients", " WHERE id = ? LIMIT 1", [row["client_id"]]))[0] || null
        : null;
  }
  if (table === "replies") {
    if (projection.includes("prospects("))
      for (const row of selected)
        row["prospects"] = row["prospect_id"]
          ? (await rows("prospects", " WHERE id = ? LIMIT 1", [row["prospect_id"]]))[0] || null
          : null;
    if (projection.includes("campaigns("))
      for (const row of selected)
        row["campaigns"] = row["campaign_id"]
          ? (await rows("campaigns", " WHERE id = ? LIMIT 1", [row["campaign_id"]]))[0] || null
          : null;
  }
  return selected;
}

async function execute(input: DbInput, allowSecrets: boolean): Promise<DbResult<unknown>> {
  try {
    if (
      !Object.prototype.hasOwnProperty.call(fields, input.table) ||
      (!allowSecrets && !publicTables.has(input.table))
    )
      throw new Error("Table is not available");
    const table = input.table;
    const condition = where(input);
    const db = getPool();
    if (input.action === "select") {
      const order = input.orderBy
        ? ` ORDER BY ${assertColumn(table, input.orderBy)} ${input.ascending === false ? "DESC" : "ASC"}`
        : "";
      const limit = ` LIMIT ${Math.max(1, Math.min(Number(input.limit) || 10000, 10000))}`;
      const selected = await rows(table, condition.sql + order + limit, condition.params);
      return { data: await enrich(table, input, selected), error: null };
    }
    if (input.action === "insert" || input.action === "upsert") {
      const values = Array.isArray(input.values) ? input.values : [input.values || {}];
      if (!values.length || values.length > 10000) throw new Error("Invalid row count");
      const inserted: Array<Record<string, unknown>> = [];
      for (const item of values) {
        const record = { ...item };
        if (table !== "mailbox_secrets" && !record["id"]) record["id"] = randomUUID();
        if (table === "prospects" && record["extra"] === undefined) record["extra"] = {};
        if (table === "campaigns") {
          record["cc"] ??= [];
          record["bcc"] ??= [];
          record["attachments"] ??= [];
        }
        const keys = Object.keys(record);
        if (!keys.length) throw new Error("Empty row");
        const cols = keys.map((key) => assertColumn(table, key));
        const params = keys.map((key) => encode(table, key, record[key]));
        const update =
          input.action === "upsert"
            ? ` ON DUPLICATE KEY UPDATE ${
                keys
                  .filter((key) => key !== "id" && key !== "mailbox_id")
                  .map((key) => `${assertColumn(table, key)} = VALUES(${assertColumn(table, key)})`)
                  .join(", ") || `${cols[0]} = ${cols[0]}`
              }`
            : "";
        await db.execute(
          `INSERT INTO \`${table}\` (${cols.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})${update}`,
          params as never[],
        );
        const lookup = table === "mailbox_secrets" ? "mailbox_id" : input.conflict || "id";
        const found = await rows(table, ` WHERE ${assertColumn(table, lookup)} = ? LIMIT 1`, [
          record[lookup],
        ]);
        if (found[0]) inserted.push(found[0]);
      }
      return { data: inserted, error: null };
    }
    if (!input.filters.length) throw new Error("Update and delete require a filter");
    if (input.action === "delete") {
      await db.execute(`DELETE FROM \`${table}\`${condition.sql}`, condition.params as never[]);
      return { data: [], error: null };
    }
    if (input.action === "update") {
      const record = (Array.isArray(input.values) ? input.values[0] : input.values) || {};
      const keys = Object.keys(record);
      if (!keys.length) throw new Error("Empty update");
      const setters = keys.map((key) => `${assertColumn(table, key)} = ?`).join(", ");
      await db.execute(`UPDATE \`${table}\` SET ${setters}${condition.sql}`, [
        ...keys.map((key) => encode(table, key, record[key])),
        ...condition.params,
      ] as never[]);
      return { data: await rows(table, condition.sql, condition.params), error: null };
    }
    throw new Error("Unsupported database action");
  } catch (error) {
    return {
      data: [],
      error: { message: error instanceof Error ? error.message : "Database error" },
    };
  }
}

export const serverDb = createDb((input) => execute(input, true));
export const runClientQuery = (input: DbInput) => execute(input, false);
