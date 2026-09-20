import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";

export const Route = createFileRoute("/cost-sheets")({
  component: CostSheetsPage,
  head: () => ({
    meta: [
      { title: "Cost sheets | Gwero OS" },
      { name: "description", content: "Internal costing behind quotes and bids." },
      { property: "og:title", content: "Cost sheets | Gwero OS" },
      { property: "og:description", content: "Internal costing behind quotes and bids." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CostSheetsPage() {
  return (
    <ModulePage
      title="Cost sheets"
      description="Work out cost, sell price and margin before you quote."
      table="cost_sheets"
      select="*, clients(name)"
      searchKeys={["name"]}
      createLabel="New cost sheet"
      detailTo={(row) => `/cost-sheets/${String(row["id"])}`}
      columns={[
        { key: "name", label: "Name" },
        {
          key: "client",
          label: "Client",
          render: (r) => (r["clients"] as { name?: string } | null)?.name ?? "—",
        },
        { key: "status", label: "Status", className: "capitalize" },
        { key: "currency", label: "Currency" },
      ]}
      fields={[
        { name: "name", label: "Name" },
        { name: "client_id", label: "Client", type: "reference", refTable: "clients" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["draft", "approved", "archived"],
          defaultValue: "draft",
        },
        { name: "currency", label: "Currency", defaultValue: "USD" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
