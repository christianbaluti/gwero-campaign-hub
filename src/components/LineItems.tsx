import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { TableName } from "@/lib/db.types";

export type ItemField = {
  name: string;
  label: string;
  type?: "text" | "number";
  defaultValue?: string;
  className?: string;
};

export type ItemRow = Record<string, unknown>;

export function LineItems({
  table,
  parentKey,
  parentId,
  fields,
  title = "Line items",
  total,
}: {
  table: TableName;
  parentKey: string;
  parentId: string;
  fields: ItemField[];
  title?: string;
  total?: (rows: ItemRow[]) => string;
}) {
  const qc = useQueryClient();
  const key = ["items", table, parentId];
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])),
  );

  const { data: rows = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .select("*")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq(parentKey as any, parentId)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .order("created_at" as any, { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ItemRow[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const values: Record<string, unknown> = { [parentKey]: parentId };
      for (const f of fields) {
        const raw = form[f.name] ?? "";
        if (raw === "") continue;
        values[f.name] = f.type === "number" ? Number(raw) : raw;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await db.from(table as any).insert(values as any);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setForm(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ""])));
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(table as any)
        .delete()
        .eq("id" as any, id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {total ? <span className="font-semibold">{total(rows)}</span> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr>
                {fields.map((f) => (
                  <th key={f.name} className="px-2 py-2 font-medium">
                    {f.label}
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r["id"])} className="border-t border-border">
                  {fields.map((f) => (
                    <td key={f.name} className="px-2 py-2">
                      {String(r[f.name] ?? "—")}
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(String(r["id"]))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-muted-foreground" colSpan={fields.length + 1}>
                    No items yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {fields.map((f) => (
            <Input
              key={f.name}
              className={f.className ?? "max-w-48"}
              type={f.type === "number" ? "number" : "text"}
              placeholder={f.label}
              value={form[f.name] ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
            />
          ))}
          <Button onClick={() => add.mutate()}>Add</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function sum(rows: ItemRow[], fn: (r: ItemRow) => number) {
  return rows.reduce((acc, r) => acc + (Number.isFinite(fn(r)) ? fn(r) : 0), 0);
}
