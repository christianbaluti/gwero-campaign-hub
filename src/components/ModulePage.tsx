import { AppShell } from "@/components/AppShell";
import { RecordsTable, useRows, type ColumnDef, type FieldDef } from "@/components/RecordsPage";
import type { TableName } from "@/lib/db.types";

export function ModulePage({
  title,
  description,
  table,
  select = "*",
  columns,
  fields,
  searchKeys,
  createLabel,
  detailTo,
}: {
  title: string;
  description: string;
  table: TableName;
  select?: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  searchKeys?: string[];
  createLabel?: string;
  detailTo?: (row: Record<string, unknown>) => string;
}) {
  const { data: rows = [], isLoading } = useRows(table, select);
  return (
    <AppShell title={title} description={description}>
      <RecordsTable
        table={table}
        select={select}
        rows={rows}
        isLoading={isLoading}
        columns={columns}
        fields={fields}
        searchKeys={searchKeys}
        createLabel={createLabel}
        detailTo={detailTo}
      />
    </AppShell>
  );
}
