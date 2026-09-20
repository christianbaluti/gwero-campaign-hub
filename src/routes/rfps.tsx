import { createFileRoute } from "@tanstack/react-router";
import { RequestsPage } from "@/components/RequestsPage";
export const Route = createFileRoute("/rfps")({
  component: () => (
    <RequestsPage
      type="rfp"
      title="Requests for Proposal"
      description="Qualify and manage proposal requests from receipt to submission."
    />
  ),
});
