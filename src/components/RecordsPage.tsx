import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import type { TableName } from "@/lib/db.types";

export type Row = Record<string, unknown>;

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "reference";
  options?: readonly string[];
  refTable?: TableName;
  refLabel?: string;
  defaultValue?: string;
  placeholder?: string;
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
  className?: string;
};

export function useRows(table: TableName, select = "*", orderBy = "created_at") {
  return useQuery({
    queryKey: ["rows", table, select],
    queryFn: async () => {
      const { data, error } = await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .select(select)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .order(orderBy as any, { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Row[];
    },
  });
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const { data: refRows = [] } = useQuery({
    queryKey: ["ref", field.refTable],
    enabled: field.type === "reference" && !!field.refTable,
    queryFn: async () => {
      const { data, error } = await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(field.refTable as any)
        .select("*")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .order("created_at" as any, { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Row[];
    },
  });

  if (field.type === "textarea") {
    return (
      <Textarea
        rows={3}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (field.type === "select") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === "reference") {
    const labelKey = field.refLabel ?? "name";
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {refRows.map((r) => (
            <SelectItem key={String(r.id)} value={String(r.id)}>
              {String(r[labelKey] ?? r.id)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function RecordsTable({
  table,
  columns,
  fields,
  select = "*",
  rows,
  isLoading,
  detailTo,
  searchKeys = [],
  emptyLabel = "Nothing here yet.",
  createLabel = "New record",
}: {
  table: TableName;
  columns: ColumnDef[];
  fields: FieldDef[];
  select?: string;
  rows: Row[];
  isLoading?: boolean;
  detailTo?: (row: Row) => string;
  searchKeys?: string[];
  emptyLabel?: string;
  createLabel?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])),
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !searchKeys.length) return rows;
    return rows.filter((r) =>
      searchKeys.some((k) =>
        String(r[k] ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, search, searchKeys]);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["rows", table, select] });

  const create = useMutation({
    mutationFn: async () => {
      const values: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = form[f.name] ?? "";
        if (raw === "" || raw === "none") continue;
        values[f.name] = f.type === "number" ? Number(raw) : raw;
      }
      if (!Object.keys(values).length) throw new Error("Fill in at least one field.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await db.from(table as any).insert(values as any);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setOpen(false);
      setForm(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])));
      toast.success("Saved.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await db
        .from(table as any)
        .delete()
        .eq("id" as any, id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Deleted.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {searchKeys.length ? (
          <Input
            className="max-w-xs"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        ) : null}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">{createLabel}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{createLabel}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <FieldInput
                    field={f}
                    value={form[f.name] ?? ""}
                    onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={create.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-medium">
                    {c.label}
                  </th>
                ))}
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={columns.length + 1}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={columns.length + 1}>
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={String(row.id)} className="border-b border-border last:border-0">
                    {columns.map((c, i) => (
                      <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                        {i === 0 && detailTo ? (
                          <Link
                            to={detailTo(row)}
                            className="font-medium text-primary hover:underline"
                          >
                            {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                          </Link>
                        ) : c.render ? (
                          c.render(row)
                        ) : (
                          (String(row[c.key] ?? "") || "—")
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(String(row.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusCell({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
