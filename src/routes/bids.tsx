import { createFileRoute } from "@tanstack/react-router";
import { ModulePage } from "@/components/ModulePage";

export const Route = createFileRoute("/bids")({
  component: BidsPage,
  head: () => ({
    meta: [
      { title: "Bids | Gwero OS" },
      { name: "description", content: "Track tenders from identification to award." },
      { property: "og:title", content: "Bids | Gwero OS" },
      { property: "og:description", content: "Track tenders from identification to award." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function BidsPage() {
  return (
    <ModulePage
      title="Bids"
      description="Tender tracker with deadlines, bonds and outcomes."
      table="bids"
      searchKeys={["reference", "title", "buyer"]}
      createLabel="New bid"
      columns={[
        { key: "title", label: "Title" },
        { key: "reference", label: "Reference" },
        { key: "buyer", label: "Buyer" },
        { key: "status", label: "Status", className: "capitalize" },
        { key: "closing_date", label: "Closing" },
        { key: "value", label: "Value" },
      ]}
      fields={[
        { name: "title", label: "Title" },
        { name: "reference", label: "Reference" },
        { name: "buyer", label: "Buyer" },
        { name: "client_id", label: "Client", type: "reference", refTable: "clients" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["identified", "preparing", "submitted", "won", "lost"],
          defaultValue: "identified",
        },
        { name: "closing_date", label: "Closing date", type: "date" },
        { name: "submission_date", label: "Submitted on", type: "date" },
        { name: "value", label: "Value", type: "number", defaultValue: "0" },
        { name: "bond_amount", label: "Bond amount", type: "number", defaultValue: "0" },
        { name: "currency", label: "Currency", defaultValue: "USD" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
