import { createFileRoute } from "@tanstack/react-router";
import { OpportunityWorkspace } from "@/components/OpportunityWorkspace";
export const Route = createFileRoute("/bids/$id")({ component: BidWorkspace });
function BidWorkspace() {
  const { id } = Route.useParams();
  return <OpportunityWorkspace kind="bid" id={id} />;
}
