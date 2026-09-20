import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";

export const Route = createFileRoute("/prequalifications")({
  component: PrequalificationsPage,
  head: () => ({
    meta: [
      { title: "EOI & prequalification | Gwero OS" },
      { name: "description", content: "Registrations and prequalification submissions." },
      { property: "og:title", content: "EOI & prequalification | Gwero OS" },
      { property: "og:description", content: "Registrations and prequalification submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PrequalificationsPage() {
  return (
    <ModulePage
      title="EOI / Prequalification"
      description="Buyer registrations, categories, validity and outcomes."
      table="prequalifications"
      searchKeys={["reference", "buyer", "category"]}
      createLabel="New submission"
      columns={[
        { key: "buyer", label: "Buyer" },
        { key: "reference", label: "Reference" },
        { key: "category", label: "Category" },
        { key: "submission_type", label: "Type", className: "capitalize" },
        { key: "status", label: "Status", className: "capitalize" },
        { key: "valid_until", label: "Valid until" },
      ]}
      fields={[
        { name: "buyer", label: "Buyer" },
        { name: "reference", label: "Reference" },
        { name: "category", label: "Category" },
        {
          name: "submission_type",
          label: "Type",
          type: "select",
          options: ["eoi", "prequalification", "registration"],
          defaultValue: "prequalification",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["preparing", "submitted", "approved", "rejected"],
          defaultValue: "preparing",
        },
        { name: "submitted_date", label: "Submitted on", type: "date" },
        { name: "valid_until", label: "Valid until", type: "date" },
        { name: "outcome", label: "Outcome" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
