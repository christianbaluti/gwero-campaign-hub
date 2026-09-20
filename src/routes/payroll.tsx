import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
export const Route = createFileRoute("/payroll")({ component: PayrollPage });
function PayrollPage() {
  return (
    <ModulePage
      title="Payroll"
      description="Prepare, review and close payroll periods."
      table="payroll_runs"
      columns={[
        { key: "period", label: "Period" },
        { key: "pay_date", label: "Pay date" },
        { key: "status", label: "Status" },
        { key: "currency", label: "Currency" },
        { key: "created_at", label: "Created" },
      ]}
      fields={[
        { name: "period", label: "Payroll period", placeholder: "2026-09" },
        { name: "pay_date", label: "Pay date", type: "date" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["draft", "review", "approved", "paid"],
          defaultValue: "draft",
        },
        { name: "currency", label: "Currency", defaultValue: "MWK" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      searchKeys={["period", "status"]}
      createLabel="New payroll run"
    />
  );
}
