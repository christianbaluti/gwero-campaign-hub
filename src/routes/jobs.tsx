import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
export const Route = createFileRoute("/jobs")({ component: JobsPage });
function JobsPage() {
  return (
    <ModulePage
      title="Jobs"
      description="Schedule and assign operational jobs."
      table="jobs"
      columns={[
        { key: "title", label: "Job" },
        { key: "job_type", label: "Type" },
        { key: "assignee", label: "Assignee" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "scheduled_date", label: "Scheduled" },
      ]}
      fields={[
        { name: "title", label: "Job title" },
        { name: "client_id", label: "Client", type: "reference", refTable: "clients" },
        { name: "project_id", label: "Project", type: "reference", refTable: "projects" },
        { name: "job_type", label: "Job type", defaultValue: "once-off" },
        { name: "assignee", label: "Assignee" },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: ["low", "medium", "high", "urgent"],
          defaultValue: "medium",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["scheduled", "in_progress", "blocked", "completed"],
          defaultValue: "scheduled",
        },
        { name: "scheduled_date", label: "Scheduled date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      searchKeys={["title", "assignee", "job_type"]}
      createLabel="New job"
    />
  );
}
