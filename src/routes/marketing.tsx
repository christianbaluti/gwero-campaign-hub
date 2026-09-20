import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";

export const Route = createFileRoute("/marketing")({
  component: MarketingPage,
  head: () => ({
    meta: [
      { title: "Marketing | Gwero OS" },
      { name: "description", content: "Plan marketing activities, budget, spend and leads." },
      { property: "og:title", content: "Marketing | Gwero OS" },
      {
        property: "og:description",
        content: "Plan marketing activities, budget, spend and leads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function MarketingPage() {
  return (
    <ModulePage
      title="Marketing"
      description="Channels, budget, spend and leads produced."
      table="marketing_activities"
      searchKeys={["name", "channel"]}
      createLabel="New activity"
      columns={[
        { key: "name", label: "Activity" },
        { key: "channel", label: "Channel" },
        { key: "status", label: "Status", className: "capitalize" },
        { key: "budget", label: "Budget" },
        { key: "spend", label: "Spend" },
        { key: "leads", label: "Leads" },
      ]}
      fields={[
        { name: "name", label: "Activity name" },
        {
          name: "channel",
          label: "Channel",
          type: "select",
          options: ["email", "social", "events", "referral", "paid ads", "content"],
          defaultValue: "email",
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["planned", "running", "complete", "paused"],
          defaultValue: "planned",
        },
        { name: "start_date", label: "Start date", type: "date" },
        { name: "end_date", label: "End date", type: "date" },
        { name: "budget", label: "Budget", type: "number", defaultValue: "0" },
        { name: "spend", label: "Spend", type: "number", defaultValue: "0" },
        { name: "leads", label: "Leads", type: "number", defaultValue: "0" },
        { name: "currency", label: "Currency", defaultValue: "USD" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
