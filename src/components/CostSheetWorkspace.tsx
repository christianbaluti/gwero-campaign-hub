import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Calculator,
  ExternalLink,
  FileText,
  FileImage,
  ImagePlus,
  Pencil,
  Plus,
  Settings2,
  Sigma,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { money } from "@/components/AppShell";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteCostSheetColumn,
  deleteCostSheetItem,
  getCostSheetWorkspace,
  saveCostSheetColumn,
  saveCostSheetItem,
  setCostSheetSourceQuote,
  updateCostSheet,
  type CostSheetAttachment,
  type CostSheetColumn,
  type CostSheetItem,
  type CostSheetSourceQuote,
} from "@/lib/cost-sheets.functions";
import {
  columnKey,
  evaluateCostSheetFormula,
  formulaIdentifiers,
  type FormulaContext,
} from "@/lib/cost-sheet-formula";

const categories = ["labour", "materials", "equipment", "logistics", "services", "other"];

type SheetRecord = {
  id: string;
  name: string;
  status: string;
  currency: string;
  notes: string | null;
  client_name: string | null;
  client_logo: string | null;
  updated_at: string;
};

type ItemForm = {
  category: string;
  description: string;
  quantity: string;
  unitCost: string;
  markupPercent: string;
  customValues: Record<string, string>;
  attachments: CostSheetAttachment[];
};

type ColumnForm = {
  name: string;
  key: string;
  dataType: "text" | "number" | "formula";
  defaultValue: string;
  formulaExpression: string;
};

type RowCalculation = {
  lineCost: number;
  sellPrice: number;
  grossProfit: number;
  custom: Record<string, string | number>;
  errors: Record<string, string>;
};

const emptyColumn: ColumnForm = {
  name: "",
  key: "",
  dataType: "text",
  defaultValue: "",
  formulaExpression: "",
};
const emptyColumns: CostSheetColumn[] = [];
const emptyItems: CostSheetItem[] = [];

function attachmentUrl(path: string) {
  const [ownerId, fileId] = path.split("/");
  return `/api/attachments/${encodeURIComponent(ownerId || "")}/${encodeURIComponent(fileId || "")}`;
}

function itemDefaults(columns: CostSheetColumn[]): ItemForm {
  return {
    category: "labour",
    description: "",
    quantity: "1",
    unitCost: "0",
    markupPercent: "0",
    customValues: Object.fromEntries(
      columns
        .filter((column) => column.data_type !== "formula")
        .map((column) => [column.column_key, column.default_value || ""]),
    ),
    attachments: [],
  };
}

function valueForColumn(item: CostSheetItem, column: CostSheetColumn) {
  const value = item.custom_values?.[column.column_key];
  return value === undefined || value === "" ? column.default_value || "" : value;
}

function calculateRow(item: CostSheetItem, columns: CostSheetColumn[]): RowCalculation {
  const lineCost = Number(item.quantity || 0) * Number(item.unit_cost || 0);
  const sellPrice = lineCost * (1 + Number(item.markup_percent || 0) / 100);
  const context: FormulaContext = {
    quantity: Number(item.quantity || 0),
    unit_cost: Number(item.unit_cost || 0),
    markup_percent: Number(item.markup_percent || 0),
    line_cost: lineCost,
    sell_price: sellPrice,
    gross_profit: sellPrice - lineCost,
  };
  const custom: Record<string, string | number> = {};
  const errors: Record<string, string> = {};
  for (const column of columns) {
    if (column.data_type === "text")
      custom[column.column_key] = String(valueForColumn(item, column));
    if (column.data_type === "number") {
      const value = Number(valueForColumn(item, column) || 0);
      custom[column.column_key] = Number.isFinite(value) ? value : 0;
      context[column.column_key] = Number.isFinite(value) ? value : 0;
    }
  }
  const formulas = new Map(
    columns
      .filter((column) => column.data_type === "formula")
      .map((column) => [column.column_key, column]),
  );
  const evaluating = new Set<string>();
  const evaluate = (key: string): number => {
    if (key in context) return context[key]!;
    if (evaluating.has(key)) throw new Error("Circular formula reference.");
    const column = formulas.get(key);
    if (!column) throw new Error(`Unknown column "${key}".`);
    evaluating.add(key);
    for (const identifier of formulaIdentifiers(column.formula_expression || ""))
      if (formulas.has(identifier) && !(identifier in context))
        context[identifier] = evaluate(identifier);
    const result = evaluateCostSheetFormula(column.formula_expression || "", context);
    evaluating.delete(key);
    context[key] = result;
    return result;
  };
  for (const [key] of formulas) {
    try {
      custom[key] = evaluate(key);
    } catch (error) {
      custom[key] = "#ERROR";
      errors[key] = error instanceof Error ? error.message : "Formula error";
    }
  }
  return { lineCost, sellPrice, grossProfit: sellPrice - lineCost, custom, errors };
}

export function CostSheetWorkspace({ costSheetId }: { costSheetId: string }) {
  const queryClient = useQueryClient();
  const loadWorkspace = useServerFn(getCostSheetWorkspace);
  const saveItem = useServerFn(saveCostSheetItem);
  const removeItem = useServerFn(deleteCostSheetItem);
  const saveColumn = useServerFn(saveCostSheetColumn);
  const removeColumn = useServerFn(deleteCostSheetColumn);
  const saveSheet = useServerFn(updateCostSheet);
  const setSourceQuote = useServerFn(setCostSheetSourceQuote);
  const queryKey = ["cost-sheet-workspace", costSheetId];
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => loadWorkspace({ data: { costSheetId } }),
  });
  const sheet = data?.sheet as SheetRecord | undefined;
  const columns = data?.columns || emptyColumns;
  const items = data?.items || emptyItems;
  const sourceQuotes = data?.sourceQuotes || [];
  const linkedQuotes = sourceQuotes.filter((quote) => Boolean(quote.is_linked));
  const calculations = useMemo(
    () => new Map(items.map((item) => [item.id, calculateRow(item, columns)])),
    [columns, items],
  );
  const totals = useMemo(() => {
    let cost = 0;
    let sell = 0;
    for (const calculation of calculations.values()) {
      cost += calculation.lineCost;
      sell += calculation.sellPrice;
    }
    return {
      cost,
      sell,
      profit: sell - cost,
      margin: sell ? ((sell - cost) / sell) * 100 : 0,
    };
  }, [calculations]);

  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostSheetItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(() => itemDefaults([]));
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [columnOpen, setColumnOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<CostSheetColumn | null>(null);
  const [columnForm, setColumnForm] = useState<ColumnForm>(emptyColumn);
  const [preview, setPreview] = useState<CostSheetAttachment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [sheetForm, setSheetForm] = useState({ name: "", status: "draft", notes: "" });

  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const openNewItem = () => {
    setEditingItem(null);
    setItemForm(itemDefaults(columns));
    setPendingImages([]);
    setItemOpen(true);
  };
  const openEditItem = (item: CostSheetItem) => {
    setEditingItem(item);
    setItemForm({
      category: item.category,
      description: item.description,
      quantity: String(item.quantity),
      unitCost: String(item.unit_cost),
      markupPercent: String(item.markup_percent),
      customValues: Object.fromEntries(
        columns
          .filter((column) => column.data_type !== "formula")
          .map((column) => [column.column_key, String(valueForColumn(item, column))]),
      ),
      attachments: item.attachments || [],
    });
    setPendingImages([]);
    setItemOpen(true);
  };
  const openNewColumn = () => {
    setEditingColumn(null);
    setColumnForm(emptyColumn);
    setColumnOpen(true);
  };
  const openEditColumn = (column: CostSheetColumn) => {
    setEditingColumn(column);
    setColumnForm({
      name: column.name,
      key: column.column_key,
      dataType: column.data_type,
      defaultValue: column.default_value || "",
      formulaExpression: column.formula_expression || "",
    });
    setColumnOpen(true);
  };

  const itemMutation = useMutation({
    mutationFn: async () => {
      const itemId = editingItem?.id || crypto.randomUUID();
      const uploaded = await Promise.all(
        pendingImages.map(async (file) => {
          const body = new FormData();
          body.append("ownerId", itemId);
          body.append("file", file);
          const response = await fetch("/api/attachments/upload", { method: "POST", body });
          const result = (await response.json()) as CostSheetAttachment & { error?: string };
          if (!response.ok) throw new Error(result.error || `Could not upload ${file.name}.`);
          return result;
        }),
      );
      return saveItem({
        data: {
          costSheetId,
          itemId,
          category: itemForm.category,
          description: itemForm.description,
          quantity: Number(itemForm.quantity),
          unitCost: Number(itemForm.unitCost),
          markupPercent: Number(itemForm.markupPercent),
          customValues: itemForm.customValues,
          attachments: [...itemForm.attachments, ...uploaded],
        },
      });
    },
    onSuccess: async () => {
      toast.success(editingItem ? "Line item updated." : "Line item added.");
      setItemOpen(false);
      await refresh();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => removeItem({ data: { costSheetId, itemId } }),
    onSuccess: async () => {
      toast.success("Line item deleted.");
      await refresh();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });
  const columnMutation = useMutation({
    mutationFn: () =>
      saveColumn({
        data: {
          costSheetId,
          ...(editingColumn ? { columnId: editingColumn.id } : {}),
          name: columnForm.name,
          key: columnForm.key || columnKey(columnForm.name),
          dataType: columnForm.dataType,
          defaultValue: columnForm.defaultValue,
          formulaExpression: columnForm.formulaExpression,
        },
      }),
    onSuccess: async () => {
      toast.success(editingColumn ? "Custom column updated." : "Custom column added.");
      setColumnOpen(false);
      await refresh();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });
  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) => removeColumn({ data: { costSheetId, columnId } }),
    onSuccess: async () => {
      toast.success("Custom column deleted.");
      await refresh();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });
  const sheetMutation = useMutation({
    mutationFn: () => saveSheet({ data: { costSheetId, ...sheetForm } }),
    onSuccess: async () => {
      toast.success("Cost sheet details updated.");
      setSettingsOpen(false);
      await refresh();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });
  const quoteMutation = useMutation({
    mutationFn: (payload: { quoteId: string; linked: boolean }) =>
      setSourceQuote({ data: { costSheetId, ...payload } }),
    onSuccess: async (_result, payload) => {
      toast.success(payload.linked ? "Source quotation linked." : "Source quotation unlinked.");
      setQuoteOpen(false);
      setSelectedQuoteId("");
      await refresh();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading)
    return (
      <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
        Loading cost sheet…
      </div>
    );
  if (error || !sheet)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        {error instanceof Error ? error.message : "Cost sheet not found."}
      </div>
    );

  const currency = sheet.currency || "USD";
  const customTotals = Object.fromEntries(
    columns
      .filter((column) => column.data_type !== "text")
      .map((column) => [
        column.column_key,
        items.reduce((sum, item) => {
          const value = calculations.get(item.id)?.custom[column.column_key];
          return sum + (typeof value === "number" && Number.isFinite(value) ? value : 0);
        }, 0),
      ]),
  );

  return (
    <div className="min-w-0 space-y-6">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-emerald-50/60 shadow-sm">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {sheet.status}
              </Badge>
              <span className="text-sm text-muted-foreground">{currency}</span>
            </div>
            <h1 className="truncate font-display text-3xl font-bold text-foreground">
              {sheet.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {sheet.client_name
                ? `Prepared for ${sheet.client_name}. `
                : "Internal costing workspace. "}
              Build costs, pricing, images and calculated columns in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSheetForm({ name: sheet.name, status: sheet.status, notes: sheet.notes || "" });
                setSettingsOpen(true);
              }}
            >
              <Settings2 className="mr-2 size-4" /> Sheet details
            </Button>
            <Button variant="outline" onClick={openNewColumn}>
              <Plus className="mr-2 size-4" /> Custom column
            </Button>
            <Button onClick={openNewItem}>
              <Plus className="mr-2 size-4" /> Add item
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total cost" value={money(totals.cost, currency)} icon={Calculator} />
        <Metric label="Selling value" value={money(totals.sell, currency)} icon={Sigma} />
        <Metric label="Gross profit" value={money(totals.profit, currency)} icon={Calculator} />
        <Metric label="Margin" value={`${totals.margin.toFixed(1)}%`} icon={Sigma} />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Supporting quotations</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Link the vendor or external quotations that support the figures in this sheet.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/vendors">
                  <FileText className="mr-2 size-4" /> Manage quotations
                </a>
              </Button>
              <Button onClick={() => setQuoteOpen(true)}>
                <Plus className="mr-2 size-4" /> Link quotation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {linkedQuotes.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {linkedQuotes.map((quote) => (
                <SourceQuoteCard
                  key={quote.id}
                  quote={quote}
                  onUnlink={() => quoteMutation.mutate({ quoteId: quote.id, linked: false })}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-7 text-center">
              <FileText className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 font-medium">No supporting quotation linked</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a quote from a saved vendor or any other external source, then link it here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Cost items</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit any row, attach reference images, or extend the sheet with your own columns.
              </p>
            </div>
            <Badge variant="outline">
              {items.length} item{items.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-20 min-w-64 border-b bg-muted px-4 py-3 font-semibold">
                    Item
                  </th>
                  <th className="min-w-32 border-b px-3 py-3 font-semibold">Category</th>
                  <th className="min-w-24 border-b px-3 py-3 text-right font-semibold">Qty</th>
                  <th className="min-w-32 border-b px-3 py-3 text-right font-semibold">
                    Unit cost
                  </th>
                  <th className="min-w-28 border-b px-3 py-3 text-right font-semibold">Markup</th>
                  {columns.map((column) => (
                    <th
                      key={column.id}
                      className="min-w-40 border-b px-3 py-2 font-semibold normal-case tracking-normal"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate">{column.name}</p>
                          <p className="font-mono text-[10px] font-normal text-muted-foreground">
                            {column.column_key}
                          </p>
                        </div>
                        <div className="flex shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            aria-label={`Edit ${column.name} column`}
                            onClick={() => openEditColumn(column)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <ConfirmAction
                            title={`Delete ${column.name}?`}
                            description="The column and its saved row values will be removed. Formulas using it must be changed first."
                            onConfirm={() => deleteColumnMutation.mutateAsync(column.id)}
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                aria-label={`Delete ${column.name} column`}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="min-w-32 border-b px-3 py-3 text-right font-semibold">
                    Line cost
                  </th>
                  <th className="min-w-32 border-b px-3 py-3 text-right font-semibold">
                    Sell price
                  </th>
                  <th className="min-w-36 border-b px-3 py-3 font-semibold">Images</th>
                  <th className="w-24 border-b px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const calculation = calculations.get(item.id)!;
                  return (
                    <tr
                      key={item.id}
                      className="group border-b transition-colors hover:bg-muted/25"
                    >
                      <td className="sticky left-0 z-10 max-w-80 bg-background px-4 py-4 group-hover:bg-muted/25">
                        <p className="font-medium text-foreground">{item.description}</p>
                      </td>
                      <td className="px-3 py-4">
                        <Badge variant="outline" className="capitalize">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-4 text-right tabular-nums">
                        {money(item.unit_cost, currency)}
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums">{item.markup_percent}%</td>
                      {columns.map((column) => {
                        const value = calculation.custom[column.column_key];
                        const formulaError = calculation.errors[column.column_key];
                        return (
                          <td
                            key={column.id}
                            className="px-3 py-4"
                            title={formulaError || column.formula_expression || undefined}
                          >
                            {formulaError ? (
                              <span className="font-medium text-destructive">#ERROR</span>
                            ) : column.data_type === "text" ? (
                              <span className="block max-w-56 truncate">
                                {String(value || "—")}
                              </span>
                            ) : (
                              <span className="block text-right tabular-nums">
                                {Number(value || 0).toLocaleString(undefined, {
                                  maximumFractionDigits: 4,
                                })}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-4 text-right font-medium tabular-nums">
                        {money(calculation.lineCost, currency)}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold tabular-nums text-primary">
                        {money(calculation.sellPrice, currency)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex min-h-10 items-center -space-x-2">
                          {(item.attachments || []).slice(0, 4).map((attachment) => (
                            <button
                              key={attachment.path}
                              type="button"
                              className="relative size-10 overflow-hidden rounded-lg border-2 border-background bg-muted shadow-sm transition hover:z-10 hover:scale-110"
                              onClick={() => setPreview(attachment)}
                              aria-label={`View ${attachment.name}`}
                            >
                              <img
                                src={attachmentUrl(attachment.path)}
                                alt={attachment.name}
                                className="size-full object-cover"
                              />
                            </button>
                          ))}
                          {(item.attachments || []).length > 4 ? (
                            <span className="relative grid size-10 place-items-center rounded-lg border-2 border-background bg-muted text-xs font-semibold">
                              +{item.attachments.length - 4}
                            </span>
                          ) : null}
                          {!item.attachments?.length ? (
                            <span className="text-xs text-muted-foreground">No images</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${item.description}`}
                            onClick={() => openEditItem(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <ConfirmAction
                            title="Delete this cost item?"
                            description="The row will be removed from this cost sheet."
                            onConfirm={() => deleteItemMutation.mutateAsync(item.id)}
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Delete ${item.description}`}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!items.length ? (
                  <tr>
                    <td colSpan={10 + columns.length} className="px-6 py-16 text-center">
                      <FileImage className="mx-auto mb-3 size-9 text-muted-foreground/60" />
                      <p className="font-medium">No cost items yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add the first item to start calculating this sheet.
                      </p>
                      <Button className="mt-4" onClick={openNewItem}>
                        <Plus className="mr-2 size-4" /> Add first item
                      </Button>
                    </td>
                  </tr>
                ) : null}
              </tbody>
              {items.length ? (
                <tfoot className="border-t-2 bg-muted/30 font-semibold">
                  <tr>
                    <td className="sticky left-0 z-10 bg-muted px-4 py-4" colSpan={2}>
                      Totals
                    </td>
                    <td colSpan={3} />
                    {columns.map((column) => (
                      <td key={column.id} className="px-3 py-4 text-right tabular-nums">
                        {column.data_type === "text"
                          ? ""
                          : Number(customTotals[column.column_key] || 0).toLocaleString(undefined, {
                              maximumFractionDigits: 4,
                            })}
                      </td>
                    ))}
                    <td className="px-3 py-4 text-right tabular-nums">
                      {money(totals.cost, currency)}
                    </td>
                    <td className="px-3 py-4 text-right tabular-nums text-primary">
                      {money(totals.sell, currency)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </CardContent>
      </Card>

      {sheet.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{sheet.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <ItemDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        editing={Boolean(editingItem)}
        form={itemForm}
        setForm={setItemForm}
        columns={columns}
        pendingImages={pendingImages}
        setPendingImages={setPendingImages}
        saving={itemMutation.isPending}
        onSave={() => itemMutation.mutate()}
      />
      <ColumnDialog
        open={columnOpen}
        onOpenChange={setColumnOpen}
        editing={Boolean(editingColumn)}
        form={columnForm}
        setForm={setColumnForm}
        columns={columns}
        saving={columnMutation.isPending}
        onSave={() => columnMutation.mutate()}
      />
      <SheetDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        form={sheetForm}
        setForm={setSheetForm}
        saving={sheetMutation.isPending}
        onSave={() => sheetMutation.mutate()}
      />
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link a supporting quotation</DialogTitle>
            <DialogDescription>
              Choose a quotation already recorded in the Vendors module.
            </DialogDescription>
          </DialogHeader>
          <Field label="Quotation">
            <Select value={selectedQuoteId} onValueChange={setSelectedQuoteId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose vendor or external quote" />
              </SelectTrigger>
              <SelectContent>
                {sourceQuotes
                  .filter((quote) => !quote.is_linked)
                  .map((quote) => (
                    <SelectItem key={quote.id} value={quote.id}>
                      {quote.source_name} · {quote.currency} {Number(quote.amount).toLocaleString()}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          {!sourceQuotes.some((quote) => !quote.is_linked) ? (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              Every recorded quote is already linked. Add another from the Vendors module first.
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedQuoteId || quoteMutation.isPending}
              onClick={() => quoteMutation.mutate({ quoteId: selectedQuoteId, linked: true })}
            >
              {quoteMutation.isPending ? "Linking…" : "Link quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>Attached item image</DialogDescription>
          </DialogHeader>
          {preview ? (
            <img
              src={attachmentUrl(preview.path)}
              alt={preview.name}
              className="max-h-[70vh] w-full rounded-xl bg-muted object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SourceQuoteCard({
  quote,
  onUnlink,
}: {
  quote: CostSheetSourceQuote;
  onUnlink: () => void;
}) {
  return (
    <article className="rounded-2xl border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{quote.source_name}</h3>
            <Badge variant="outline">{quote.supplier_id ? "Vendor" : "External source"}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {quote.quote_reference || "No reference"}
            {quote.quote_date ? ` · ${String(quote.quote_date).slice(0, 10)}` : ""}
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">
          {money(Number(quote.amount || 0), quote.currency)}
        </p>
      </div>
      {quote.notes ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{quote.notes}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        {quote.attachment_path ? (
          <Button variant="ghost" size="sm" asChild>
            <a href={attachmentUrl(quote.attachment_path)} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 size-4" />
              {quote.attachment_name || "Open quotation"}
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">No document attached</span>
        )}
        <ConfirmAction
          title="Unlink this quotation?"
          description="The quotation remains available in the Vendors module."
          onConfirm={async () => onUnlink()}
          trigger={
            <Button variant="ghost" size="sm">
              Unlink
            </Button>
          }
        />
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Calculator;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  columns,
  pendingImages,
  setPendingImages,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: ItemForm;
  setForm: React.Dispatch<React.SetStateAction<ItemForm>>;
  columns: CostSheetColumn[];
  pendingImages: File[];
  setPendingImages: React.Dispatch<React.SetStateAction<File[]>>;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit cost item" : "Add cost item"}</DialogTitle>
          <DialogDescription>
            Capture the cost, pricing inputs, custom values and supporting images.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Description" className="sm:col-span-2">
            <Input
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Field>
          <Field label="Category">
            <Select
              value={form.category}
              onValueChange={(category) => setForm((current) => ({ ...current, category }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="capitalize">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quantity">
            <Input
              type="number"
              min="0"
              step="any"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({ ...current, quantity: event.target.value }))
              }
            />
          </Field>
          <Field label="Unit cost">
            <Input
              type="number"
              min="0"
              step="any"
              value={form.unitCost}
              onChange={(event) =>
                setForm((current) => ({ ...current, unitCost: event.target.value }))
              }
            />
          </Field>
          <Field label="Markup percentage">
            <Input
              type="number"
              step="any"
              value={form.markupPercent}
              onChange={(event) =>
                setForm((current) => ({ ...current, markupPercent: event.target.value }))
              }
            />
          </Field>
          {columns
            .filter((column) => column.data_type !== "formula")
            .map((column) => (
              <Field key={column.id} label={column.name}>
                <Input
                  type={column.data_type === "number" ? "number" : "text"}
                  step={column.data_type === "number" ? "any" : undefined}
                  value={form.customValues[column.column_key] || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customValues: {
                        ...current.customValues,
                        [column.column_key]: event.target.value,
                      },
                    }))
                  }
                />
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {column.column_key}
                </p>
              </Field>
            ))}
        </div>
        <div className="space-y-3 rounded-xl border border-dashed p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Item images</p>
              <p className="text-xs text-muted-foreground">
                Product photos, screenshots, specifications or visual references.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <ImagePlus className="mr-2 size-4" /> Choose images
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    setPendingImages((current) => [
                      ...current,
                      ...Array.from(event.target.files || []),
                    ]);
                    event.target.value = "";
                  }}
                />
              </label>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {form.attachments.map((attachment) => (
              <div
                key={attachment.path}
                className="group relative overflow-hidden rounded-lg border"
              >
                <img
                  src={attachmentUrl(attachment.path)}
                  alt={attachment.name}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-background/90 opacity-0 shadow group-hover:opacity-100"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      attachments: current.attachments.filter(
                        (image) => image.path !== attachment.path,
                      ),
                    }))
                  }
                  aria-label={`Remove ${attachment.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
            {pendingImages.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="group relative grid aspect-square place-items-center rounded-lg border bg-muted p-2 text-center"
              >
                <FileImage className="mb-1 size-6 text-muted-foreground" />
                <span className="line-clamp-2 text-xs">{file.name}</span>
                <button
                  type="button"
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-background shadow"
                  onClick={() =>
                    setPendingImages((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColumnDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  columns,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: ColumnForm;
  setForm: React.Dispatch<React.SetStateAction<ColumnForm>>;
  columns: CostSheetColumn[];
  saving: boolean;
  onSave: () => void;
}) {
  const suggestedKey = columnKey(form.name);
  const references = [
    "quantity",
    "unit_cost",
    "markup_percent",
    "line_cost",
    "sell_price",
    "gross_profit",
    ...columns
      .filter((column) => !editing || column.column_key !== form.key)
      .map((column) => column.column_key),
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit custom column" : "Add custom column"}</DialogTitle>
          <DialogDescription>
            Add text, numeric input, or a calculated formula column.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Column name">
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  ...(!editing && !current.key ? { key: columnKey(event.target.value) } : {}),
                }))
              }
            />
          </Field>
          <Field label="Column type">
            <Select
              value={form.dataType}
              onValueChange={(dataType: ColumnForm["dataType"]) =>
                setForm((current) => ({ ...current, dataType }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Words / text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="formula">Formula</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Reference key" className="sm:col-span-2">
            <Input
              value={form.key || suggestedKey}
              disabled={editing}
              onChange={(event) =>
                setForm((current) => ({ ...current, key: columnKey(event.target.value) }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use this key when referring to the column in formulas. It cannot change after
              creation.
            </p>
          </Field>
          {form.dataType !== "formula" ? (
            <Field label="Default value" className="sm:col-span-2">
              <Input
                type={form.dataType === "number" ? "number" : "text"}
                step={form.dataType === "number" ? "any" : undefined}
                value={form.defaultValue}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultValue: event.target.value }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Applied when a row does not contain its own value. Useful for tax or conversion
                rates.
              </p>
            </Field>
          ) : (
            <Field label="Formula" className="sm:col-span-2">
              <Input
                className="font-mono"
                placeholder="sell_price * tax_rate / 100"
                value={form.formulaExpression}
                onChange={(event) =>
                  setForm((current) => ({ ...current, formulaExpression: event.target.value }))
                }
              />
              <p className="mt-2 text-xs text-muted-foreground">
                BODMAS supported: brackets, powers (^), multiplication, division, addition and
                subtraction.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {references.map((reference) => (
                  <button
                    key={reference}
                    type="button"
                    className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] hover:bg-accent"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        formulaExpression: `${current.formulaExpression}${current.formulaExpression && !current.formulaExpression.endsWith(" ") ? " " : ""}${reference}`,
                      }))
                    }
                  >
                    {reference}
                  </button>
                ))}
              </div>
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : editing ? "Save column" : "Add column"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SheetDialog({
  open,
  onOpenChange,
  form,
  setForm,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { name: string; status: string; notes: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; status: string; notes: string }>>;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cost sheet details</DialogTitle>
          <DialogDescription>
            Update the workspace name, workflow status and notes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onValueChange={(status) => setForm((current) => ({ ...current, status }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Notes">
            <Textarea
              rows={5}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : "Save details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
