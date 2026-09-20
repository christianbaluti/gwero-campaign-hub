import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
export const Route = createFileRoute("/documents")({ component: DocumentsPage });
function DocumentsPage() {
  return (
    <ModulePage
      title="Documents"
      description="Register, own and monitor business documents."
      table="documents"
      columns={[
        { key: "title", label: "Document" },
        { key: "category", label: "Category" },
        { key: "entity_type", label: "Linked to" },
        { key: "owner", label: "Owner" },
        { key: "version", label: "Version" },
        { key: "expiry_date", label: "Expires" },
      ]}
      fields={[
        { name: "title", label: "Title" },
        { name: "category", label: "Category", defaultValue: "general" },
        { name: "entity_type", label: "Linked area", defaultValue: "general" },
        { name: "owner", label: "Owner" },
        { name: "version", label: "Version" },
        { name: "file_url", label: "File URL" },
        { name: "issue_date", label: "Issue date", type: "date" },
        { name: "expiry_date", label: "Expiry date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      searchKeys={["title", "category", "owner"]}
      createLabel="Register document"
    />
  );
}
