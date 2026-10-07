import { createFileRoute } from "@tanstack/react-router";
import { OpportunityWorkspace } from "@/components/OpportunityWorkspace";
export const Route = createFileRoute("/rfps/$id")({ component: RfpWorkspace });
function RfpWorkspace() {
  const { id } = Route.useParams();
  return <OpportunityWorkspace kind="rfp" id={id} />;
}
