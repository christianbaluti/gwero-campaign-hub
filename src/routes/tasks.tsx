import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
export const Route = createFileRoute("/tasks")({ component: TasksPage });
function TasksPage() {
  return (
    <ModulePage
      title="Tasks & Activities"
      description="Track accountable work across every module."
      table="tasks"
      columns={[
        { key: "title", label: "Task" },
        { key: "entity_type", label: "Area" },
        { key: "assignee", label: "Assignee" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "due_date", label: "Due" },
      ]}
      fields={[
        { name: "title", label: "Task" },
        {
          name: "entity_type",
          label: "Area",
          type: "select",
          options: ["general", "client", "project", "bid", "job", "hr", "finance"],
          defaultValue: "general",
        },
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
          options: ["open", "in_progress", "blocked", "done"],
          defaultValue: "open",
        },
        { name: "due_date", label: "Due date", type: "date" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      searchKeys={["title", "assignee", "entity_type"]}
      createLabel="New task"
    />
  );
}
