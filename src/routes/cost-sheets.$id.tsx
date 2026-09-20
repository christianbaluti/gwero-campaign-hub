import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, money } from "@/components/AppShell";
import { LineItems, sum } from "@/components/LineItems";
import { db } from "@/lib/db";

export const Route = createFileRoute("/cost-sheets/$id")({
  component: CostSheetDetail,
  head: () => ({
    meta: [
      { title: "Cost sheet | Gwero OS" },
      { name: "description", content: "Cost lines, markup and margin." },
      { property: "og:title", content: "Cost sheet | Gwero OS" },
      { property: "og:description", content: "Cost lines, markup and margin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CostSheetDetail() {
  const { id } = Route.useParams();
  const { data: sheet } = useQuery({
    queryKey: ["cost-sheet", id],
    queryFn: async () => {
      const { data, error } = await db.from("cost_sheets").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const currency = sheet?.currency ?? "USD";

  return (
    <AppShell title={sheet?.name ?? "Cost sheet"} description="Cost lines, markup and margin.">
      <LineItems
        table="cost_sheet_items"
        parentKey="cost_sheet_id"
        parentId={id}
        title="Cost lines"
        fields={[
          { name: "category", label: "Category", defaultValue: "labour" },
          { name: "description", label: "Description", className: "min-w-56 flex-1" },
          { name: "quantity", label: "Qty", type: "number", defaultValue: "1" },
          { name: "unit_cost", label: "Unit cost", type: "number", defaultValue: "0" },
          { name: "markup_percent", label: "Markup %", type: "number", defaultValue: "0" },
        ]}
        total={(rows) => {
          const cost = sum(rows, (r) => Number(r["quantity"]) * Number(r["unit_cost"]));
          const sell = sum(
            rows,
            (r) =>
              Number(r["quantity"]) *
              Number(r["unit_cost"]) *
              (1 + Number(r["markup_percent"]) / 100),
          );
          const margin = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
          return `Cost ${money(cost, currency)} · Sell ${money(sell, currency)} · Margin ${margin.toFixed(1)}%`;
        }}
      />
    </AppShell>
  );
}
