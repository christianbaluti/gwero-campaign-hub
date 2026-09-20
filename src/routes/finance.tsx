import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
import { money } from "@/components/AppShell";
export const Route = createFileRoute("/finance")({ component: FinancePage });
function FinancePage() {
  return (
    <ModulePage
      title="Finance & Accounts"
      description="Track customer invoices, amounts due and collections."
      table="invoices"
      columns={[
        { key: "invoice_number", label: "Invoice" },
        { key: "status", label: "Status" },
        { key: "issue_date", label: "Issued" },
        { key: "due_date", label: "Due" },
        {
          key: "amount",
          label: "Amount",
          render: (r) => money(Number(r["amount"]), String(r["currency"] || "MWK")),
        },
        {
          key: "paid_amount",
          label: "Paid",
          render: (r) => money(Number(r["paid_amount"]), String(r["currency"] || "MWK")),
        },
      ]}
      fields={[
        { name: "invoice_number", label: "Invoice number" },
        { name: "client_id", label: "Client", type: "reference", refTable: "clients" },
        { name: "project_id", label: "Project", type: "reference", refTable: "projects" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["draft", "issued", "part_paid", "paid", "overdue", "cancelled"],
          defaultValue: "draft",
        },
        { name: "issue_date", label: "Issue date", type: "date" },
        { name: "due_date", label: "Due date", type: "date" },
        { name: "amount", label: "Amount", type: "number", defaultValue: "0" },
        { name: "tax", label: "Tax", type: "number", defaultValue: "0" },
        { name: "paid_amount", label: "Paid amount", type: "number", defaultValue: "0" },
        { name: "currency", label: "Currency", defaultValue: "MWK" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      searchKeys={["invoice_number", "status"]}
      createLabel="New invoice"
    />
  );
}
