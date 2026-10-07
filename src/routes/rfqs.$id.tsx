import { createFileRoute } from "@tanstack/react-router";
import { OpportunityWorkspace } from "@/components/OpportunityWorkspace";
export const Route = createFileRoute("/rfqs/$id")({ component: RfqWorkspace });
function RfqWorkspace() {
  const { id } = Route.useParams();
  return <OpportunityWorkspace kind="rfq" id={id} />;
}
