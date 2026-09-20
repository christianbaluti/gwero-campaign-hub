import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
import { money } from "@/components/AppShell";
export const Route = createFileRoute("/hr")({ component: HrPage });
function HrPage() {
  return (
    <ModulePage
      title="Human Resources"
      description="Maintain the employee register and employment records."
      table="employees"
      columns={[
        { key: "full_name", label: "Employee" },
        { key: "employee_number", label: "Number" },
        { key: "job_title", label: "Role" },
        { key: "department", label: "Department" },
        { key: "status", label: "Status" },
        {
          key: "base_salary",
          label: "Base salary",
          render: (r) => money(Number(r["base_salary"]), String(r["currency"] || "MWK")),
        },
      ]}
      fields={[
        { name: "full_name", label: "Full name" },
        { name: "employee_number", label: "Employee number" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Phone" },
        { name: "job_title", label: "Job title" },
        { name: "department", label: "Department" },
        {
          name: "employment_type",
          label: "Employment type",
          type: "select",
          options: ["full-time", "part-time", "contract", "internship"],
          defaultValue: "full-time",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["active", "probation", "leave", "exited"],
          defaultValue: "active",
        },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "base_salary", label: "Base salary", type: "number", defaultValue: "0" },
        { name: "currency", label: "Currency", defaultValue: "MWK" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      searchKeys={["full_name", "employee_number", "department", "job_title"]}
      createLabel="Add employee"
    />
  );
}
