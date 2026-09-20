import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
export const Route = createFileRoute("/procurement")({ component: ProcurementPage });
function ProcurementPage() {
  return (
    <ModulePage
      title="Procurement"
      description="Manage suppliers and purchase orders for delivery."
      table="purchase_orders"
      columns={[
        { key: "po_number", label: "PO number" },
        { key: "status", label: "Status" },
        { key: "order_date", label: "Order date" },
        { key: "expected_date", label: "Expected" },
        { key: "currency", label: "Currency" },
      ]}
      fields={[
        { name: "po_number", label: "PO number" },
        { name: "supplier_id", label: "Supplier", type: "reference", refTable: "suppliers" },
        { name: "project_id", label: "Project", type: "reference", refTable: "projects" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["requested", "approved", "ordered", "part_received", "received", "cancelled"],
          defaultValue: "requested",
        },
        { name: "order_date", label: "Order date", type: "date" },
        { name: "expected_date", label: "Expected date", type: "date" },
        { name: "currency", label: "Currency", defaultValue: "MWK" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      searchKeys={["po_number", "status"]}
      createLabel="New purchase order"
    />
  );
}
