import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
import { money } from "@/components/AppShell";

export const Route = createFileRoute("/projects")({ component: ProjectsPage });
function ProjectsPage() {
  return (
    <ModulePage
      title="Projects"
      description="Plan delivery, budgets and progress in one place."
      table="projects"
      columns={[
        { key: "name", label: "Project" },
        { key: "code", label: "Code" },
        { key: "manager", label: "Manager" },
        { key: "status", label: "Status" },
        { key: "progress", label: "Progress", render: (r) => `${r["progress"] ?? 0}%` },
        {
          key: "budget",
          label: "Budget",
          render: (r) => money(Number(r["budget"]), String(r["currency"] || "USD")),
        },
      ]}
      fields={[
        { name: "name", label: "Project name" },
        { name: "code", label: "Code" },
        { name: "client_id", label: "Client", type: "reference", refTable: "clients" },
        { name: "manager", label: "Manager" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["planned", "active", "on_hold", "completed"],
          defaultValue: "planned",
        },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "end_date", label: "End date", type: "date" },
        { name: "budget", label: "Budget", type: "number", defaultValue: "0" },
        { name: "currency", label: "Currency", defaultValue: "MWK" },
        { name: "progress", label: "Progress %", type: "number", defaultValue: "0" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      searchKeys={["name", "code", "manager"]}
      createLabel="New project"
    />
  );
}
