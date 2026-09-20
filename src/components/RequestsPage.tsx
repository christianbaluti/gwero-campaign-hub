import { AppShell, money } from "@/components/AppShell";
import { RecordsTable, useRows } from "@/components/RecordsPage";

export function RequestsPage({
  type,
  title,
  description,
}: {
  type: "rfp" | "rfq";
  title: string;
  description: string;
}) {
  const { data: all = [], isLoading } = useRows("requests");
  const rows = all.filter((row) => row["request_type"] === type);
  return (
    <AppShell title={title} description={description}>
      <RecordsTable
        table="requests"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "title", label: "Request" },
          { key: "reference", label: "Reference" },
          { key: "issuer", label: "Issuer" },
          { key: "status", label: "Status" },
          { key: "due_date", label: "Due" },
          {
            key: "value",
            label: "Value",
            render: (r) => money(Number(r["value"]), String(r["currency"] || "MWK")),
          },
        ]}
        fields={[
          { name: "title", label: "Title" },
          { name: "reference", label: "Reference" },
          { name: "issuer", label: "Issuer" },
          { name: "client_id", label: "Client", type: "reference", refTable: "clients" },
          {
            name: "request_type",
            label: "Type",
            type: "select",
            options: ["rfp", "rfq"],
            defaultValue: type,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: ["received", "reviewing", "responding", "submitted", "won", "lost"],
            defaultValue: "received",
          },
          { name: "received_date", label: "Received", type: "date" },
          { name: "due_date", label: "Due", type: "date" },
          { name: "value", label: "Estimated value", type: "number", defaultValue: "0" },
          { name: "currency", label: "Currency", defaultValue: "MWK" },
          { name: "scope", label: "Scope", type: "textarea" },
        ]}
        searchKeys={["title", "reference", "issuer"]}
        createLabel={type === "rfp" ? "New RFP" : "New RFQ"}
      />
    </AppShell>
  );
}
