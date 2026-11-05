import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CostSheetWorkspace } from "@/components/CostSheetWorkspace";

export const Route = createFileRoute("/cost-sheets/$id")({
  component: CostSheetDetail,
  head: () => ({
    meta: [
      { title: "Cost sheet | Gwero OS" },
      { name: "description", content: "Cost lines, markup and margin." },
      { property: "og:title", content: "Cost sheet | Gwero OS" },
      { property: "og:description", content: "Cost lines, markup and margin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CostSheetDetail() {
  const { id } = Route.useParams();
  return (
    <AppShell title="Cost sheet" description="Costs, pricing, evidence and calculations.">
      <CostSheetWorkspace costSheetId={id} />
    </AppShell>
  );
}
