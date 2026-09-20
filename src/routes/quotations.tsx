import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";

export const Route = createFileRoute("/quotations")({
  component: QuotationsPage,
  head: () => ({
    meta: [
      { title: "Quotations | Gwero OS" },
      { name: "description", content: "Build, send and track client quotations." },
      { property: "og:title", content: "Quotations | Gwero OS" },
      { property: "og:description", content: "Build, send and track client quotations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const statuses = ["draft", "sent", "accepted", "rejected", "expired"] as const;

function QuotationsPage() {
  return (
    <ModulePage
      title="Quotations"
      description="Quotes per client with line items, validity and status."
      table="quotations"
      select="*, clients(name)"
      searchKeys={["quote_number", "title"]}
      createLabel="New quotation"
      detailTo={(row) => `/quotations/${String(row["id"])}`}
      columns={[
        { key: "quote_number", label: "Number" },
        { key: "title", label: "Title" },
        {
          key: "client",
          label: "Client",
          render: (r) => (r["clients"] as { name?: string } | null)?.name ?? "—",
        },
        { key: "status", label: "Status", className: "capitalize" },
        { key: "valid_until", label: "Valid until" },
      ]}
      fields={[
        { name: "quote_number", label: "Quote number" },
        { name: "title", label: "Title" },
        { name: "client_id", label: "Client", type: "reference", refTable: "clients" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: statuses,
          defaultValue: "draft",
        },
        { name: "currency", label: "Currency", defaultValue: "USD" },
        { name: "issue_date", label: "Issue date", type: "date" },
        { name: "valid_until", label: "Valid until", type: "date" },
        { name: "tax_rate", label: "Tax rate %", type: "number", defaultValue: "0" },
        { name: "discount", label: "Discount", type: "number", defaultValue: "0" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
