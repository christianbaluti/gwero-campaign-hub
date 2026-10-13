import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth.middleware";
import { columnKey, formulaIdentifiers } from "./cost-sheet-formula";

export type CostSheetAttachment = {
  path: string;
  name: string;
  type: string;
  size: number;
};

export type CostSheetColumn = {
  id: string;
  cost_sheet_id: string;
  name: string;
  column_key: string;
  data_type: "text" | "number" | "formula";
  default_value: string | null;
  formula_expression: string | null;
  display_order: number;
};

export type CostSheetItem = {
  id: string;
  cost_sheet_id: string;
  category: string;
  description: string;
  quantity: number;
  unit_cost: number;
  markup_percent: number;
  custom_values: Record<string, string | number>;
  attachments: CostSheetAttachment[];
  created_at: string;
  updated_at: string;
};

export type CostSheetRecord = {
  id: string;
  name: string;
  client_id: string | null;
  quotation_id: string | null;
  bid_id: string | null;
  project_id: string | null;
  status: string;
  currency: string;
  notes: string | null;
  client_name: string | null;
  client_logo: string | null;
  created_at: string;
  updated_at: string;
};

export type CostSheetWorkspaceData = {
  sheet: CostSheetRecord;
  columns: CostSheetColumn[];
  items: CostSheetItem[];
};

type ItemInput = {
  costSheetId: string;
  itemId?: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  markupPercent: number;
  customValues: Record<string, string | number>;
  attachments: CostSheetAttachment[];
};

const builtInFormulaKeys = new Set([
  "quantity",
  "unit_cost",
  "markup_percent",
  "line_cost",
  "sell_price",
  "gross_profit",
]);

function parseJson<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object") return value as T;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function serialize<T>(rows: T) {
  return JSON.parse(JSON.stringify(rows)) as T;
}

function validateNumber(value: number, label: string) {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a valid number.`);
}

function validateAttachments(attachments: CostSheetAttachment[]) {
  if (attachments.length > 12) throw new Error("A line item can contain up to 12 images.");
  for (const attachment of attachments) {
    if (!attachment.type.startsWith("image/"))
      throw new Error("Only image attachments are allowed.");
    if (!attachment.path || !attachment.name) throw new Error("An image attachment is incomplete.");
  }
}

function validateFormulaGraph(columns: CostSheetColumn[]) {
  const available = new Set([...builtInFormulaKeys, ...columns.map((column) => column.column_key)]);
  const formulaDependencies = new Map<string, string[]>();
  for (const column of columns) {
    if (column.data_type !== "formula") continue;
    const expression = column.formula_expression?.trim() || "";
    const identifiers = formulaIdentifiers(expression);
    for (const identifier of identifiers)
      if (!available.has(identifier)) throw new Error(`Unknown formula column "${identifier}".`);
    formulaDependencies.set(
      column.column_key,
      identifiers.filter((identifier) =>
        columns.some(
          (candidate) => candidate.column_key === identifier && candidate.data_type === "formula",
        ),
      ),
    );
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (key: string) => {
    if (visiting.has(key))
      throw new Error("Formula columns cannot reference each other in a circle.");
    if (visited.has(key)) return;
    visiting.add(key);
    for (const dependency of formulaDependencies.get(key) || []) visit(dependency);
    visiting.delete(key);
    visited.add(key);
  };
  for (const key of formulaDependencies.keys()) visit(key);
}

export const getCostSheetWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: { costSheetId: string }) => data)
  .handler(async ({ data }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    const [[sheetRows], [columnRows], [itemRows]] = await Promise.all([
      db.execute(
        `SELECT cs.*, c.name AS client_name, c.logo_path AS client_logo
           FROM cost_sheets cs
           LEFT JOIN clients c ON c.id = cs.client_id
          WHERE cs.id = ? LIMIT 1`,
        [data.costSheetId],
      ),
      db.execute(
        `SELECT * FROM cost_sheet_columns
          WHERE cost_sheet_id = ? ORDER BY display_order ASC, created_at ASC`,
        [data.costSheetId],
      ),
      db.execute(
        `SELECT * FROM cost_sheet_items
          WHERE cost_sheet_id = ? ORDER BY created_at ASC`,
        [data.costSheetId],
      ),
    ]);
    const sheet = (sheetRows as unknown as CostSheetRecord[])[0];
    if (!sheet) throw new Error("Cost sheet not found.");
    const items = (itemRows as Array<Record<string, unknown>>).map((row) => ({
      ...row,
      custom_values: parseJson<Record<string, string | number>>(row["custom_values"], {}),
      attachments: parseJson<CostSheetAttachment[]>(row["attachments"], []),
    })) as unknown as CostSheetItem[];
    return serialize<CostSheetWorkspaceData>({
      sheet,
      columns: columnRows as unknown as CostSheetColumn[],
      items,
    });
  });

export const saveCostSheetItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: ItemInput) => data)
  .handler(async ({ data }) => {
    if (!data.description.trim()) throw new Error("Add an item description.");
    validateNumber(data.quantity, "Quantity");
    validateNumber(data.unitCost, "Unit cost");
    validateNumber(data.markupPercent, "Markup");
    if (data.quantity < 0 || data.unitCost < 0)
      throw new Error("Quantity and unit cost cannot be negative.");
    validateAttachments(data.attachments || []);
    const { getPool } = await import("./db.server");
    const db = getPool();
    const itemId = data.itemId || randomUUID();
    const [existingRows] = await db.execute(
      `SELECT id FROM cost_sheet_items WHERE id = ? AND cost_sheet_id = ? LIMIT 1`,
      [itemId, data.costSheetId],
    );
    const itemExists = (existingRows as Array<{ id: string }>).length > 0;
    if (itemExists) {
      const [result] = await db.execute(
        `UPDATE cost_sheet_items
            SET category = ?, description = ?, quantity = ?, unit_cost = ?, markup_percent = ?,
                custom_values = ?, attachments = ?
          WHERE id = ? AND cost_sheet_id = ?`,
        [
          data.category.trim() || "other",
          data.description.trim(),
          data.quantity,
          data.unitCost,
          data.markupPercent,
          JSON.stringify(data.customValues || {}),
          JSON.stringify(data.attachments || []),
          itemId,
          data.costSheetId,
        ],
      );
    } else {
      await db.execute(
        `INSERT INTO cost_sheet_items
          (id, cost_sheet_id, category, description, quantity, unit_cost, markup_percent,
           custom_values, attachments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          itemId,
          data.costSheetId,
          data.category.trim() || "other",
          data.description.trim(),
          data.quantity,
          data.unitCost,
          data.markupPercent,
          JSON.stringify(data.customValues || {}),
          JSON.stringify(data.attachments || []),
        ],
      );
    }
    return { id: itemId };
  });

export const deleteCostSheetItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { costSheetId: string; itemId: string }) => data)
  .handler(async ({ data }) => {
    const { getPool } = await import("./db.server");
    const [result] = await getPool().execute(
      "DELETE FROM cost_sheet_items WHERE id = ? AND cost_sheet_id = ?",
      [data.itemId, data.costSheetId],
    );
    if (!(result as { affectedRows: number }).affectedRows) throw new Error("Line item not found.");
    return { deleted: true };
  });

export const saveCostSheetColumn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      costSheetId: string;
      columnId?: string;
      name: string;
      key: string;
      dataType: "text" | "number" | "formula";
      defaultValue: string;
      formulaExpression: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    if (!data.name.trim()) throw new Error("Add a column name.");
    const key = columnKey(data.key || data.name);
    if (!key) throw new Error("Add a valid column reference key.");
    if (builtInFormulaKeys.has(key)) throw new Error(`"${key}" is reserved by the cost sheet.`);
    if (!["text", "number", "formula"].includes(data.dataType))
      throw new Error("Select a valid column type.");
    if (
      data.dataType === "number" &&
      data.defaultValue &&
      !Number.isFinite(Number(data.defaultValue))
    )
      throw new Error("The default value must be a number.");
    if (data.dataType === "formula" && !data.formulaExpression.trim())
      throw new Error("Enter the formula for this column.");

    const { getPool } = await import("./db.server");
    const db = getPool();
    const [rows] = await db.execute(
      "SELECT * FROM cost_sheet_columns WHERE cost_sheet_id = ? ORDER BY display_order ASC",
      [data.costSheetId],
    );
    const existing = rows as CostSheetColumn[];
    const current = data.columnId ? existing.find((column) => column.id === data.columnId) : null;
    if (data.columnId && !current) throw new Error("Custom column not found.");
    if (existing.some((column) => column.column_key === key && column.id !== data.columnId))
      throw new Error(`The reference key "${key}" is already in use.`);
    const candidate: CostSheetColumn = {
      id: data.columnId || randomUUID(),
      cost_sheet_id: data.costSheetId,
      name: data.name.trim(),
      column_key: current?.column_key || key,
      data_type: data.dataType,
      default_value: data.dataType === "formula" ? null : data.defaultValue.trim() || null,
      formula_expression:
        data.dataType === "formula" ? data.formulaExpression.trim().toLowerCase() : null,
      display_order: current?.display_order ?? existing.length,
    };
    validateFormulaGraph([...existing.filter((column) => column.id !== candidate.id), candidate]);

    if (data.columnId) {
      await db.execute(
        `UPDATE cost_sheet_columns
            SET name = ?, data_type = ?, default_value = ?, formula_expression = ?
          WHERE id = ? AND cost_sheet_id = ?`,
        [
          candidate.name,
          candidate.data_type,
          candidate.default_value,
          candidate.formula_expression,
          candidate.id,
          data.costSheetId,
        ],
      );
    } else {
      await db.execute(
        `INSERT INTO cost_sheet_columns
          (id, cost_sheet_id, name, column_key, data_type, default_value, formula_expression, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          candidate.id,
          data.costSheetId,
          candidate.name,
          candidate.column_key,
          candidate.data_type,
          candidate.default_value,
          candidate.formula_expression,
          candidate.display_order,
        ],
      );
    }
    return { id: candidate.id, key: candidate.column_key };
  });

export const deleteCostSheetColumn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { costSheetId: string; columnId: string }) => data)
  .handler(async ({ data }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [columnRows] = await connection.execute(
        "SELECT column_key FROM cost_sheet_columns WHERE id = ? AND cost_sheet_id = ? LIMIT 1",
        [data.columnId, data.costSheetId],
      );
      const column = (columnRows as Array<{ column_key: string }>)[0];
      if (!column) throw new Error("Custom column not found.");
      const [dependentRows] = await connection.execute(
        `SELECT name, formula_expression FROM cost_sheet_columns
          WHERE cost_sheet_id = ? AND data_type = 'formula' AND id <> ?`,
        [data.costSheetId, data.columnId],
      );
      for (const dependent of dependentRows as Array<{ name: string; formula_expression: string }>)
        if (formulaIdentifiers(dependent.formula_expression || "").includes(column.column_key))
          throw new Error(`Remove the reference from formula column "${dependent.name}" first.`);

      const [itemRows] = await connection.execute(
        "SELECT id, custom_values FROM cost_sheet_items WHERE cost_sheet_id = ?",
        [data.costSheetId],
      );
      for (const item of itemRows as Array<{ id: string; custom_values: string | null }>) {
        const values = parseJson<Record<string, string | number>>(item.custom_values, {});
        delete values[column.column_key];
        await connection.execute("UPDATE cost_sheet_items SET custom_values = ? WHERE id = ?", [
          JSON.stringify(values),
          item.id,
        ]);
      }
      await connection.execute("DELETE FROM cost_sheet_columns WHERE id = ?", [data.columnId]);
      await connection.commit();
      return { deleted: true };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  });

export const updateCostSheet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { costSheetId: string; name: string; status: string; notes: string }) => data)
  .handler(async ({ data }) => {
    if (!data.name.trim()) throw new Error("Add a cost sheet name.");
    if (!["draft", "approved", "archived"].includes(data.status))
      throw new Error("Select a valid status.");
    const { getPool } = await import("./db.server");
    await getPool().execute("UPDATE cost_sheets SET name = ?, status = ?, notes = ? WHERE id = ?", [
      data.name.trim(),
      data.status,
      data.notes.trim() || null,
      data.costSheetId,
    ]);
    return { updated: true };
  });
