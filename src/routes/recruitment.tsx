import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";
export const Route = createFileRoute("/recruitment")({ component: RecruitmentPage });
function RecruitmentPage() {
  return (
    <ModulePage
      title="Recruitment"
      description="Move vacancies from approval through hiring."
      table="vacancies"
      columns={[
        { key: "title", label: "Vacancy" },
        { key: "department", label: "Department" },
        { key: "employment_type", label: "Type" },
        { key: "openings", label: "Openings" },
        { key: "status", label: "Status" },
        { key: "closing_date", label: "Closes" },
      ]}
      fields={[
        { name: "title", label: "Job title" },
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
          options: ["draft", "open", "interviewing", "filled", "closed"],
          defaultValue: "open",
        },
        { name: "openings", label: "Openings", type: "number", defaultValue: "1" },
        { name: "location", label: "Location" },
        { name: "closing_date", label: "Closing date", type: "date" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      searchKeys={["title", "department", "location"]}
      createLabel="New vacancy"
    />
  );
}
