import { createFileRoute } from "@tanstack/react-router";
import { OpportunityWorkspace } from "@/components/OpportunityWorkspace";

export const Route = createFileRoute("/prequalifications/$id")({
  component: PrequalificationWorkspace,
});

function PrequalificationWorkspace() {
  const { id } = Route.useParams();
  return <OpportunityWorkspace kind="eoi" id={id} />;
}
