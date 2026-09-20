import { createFileRoute } from "@tanstack/react-router";
import { RequestsPage } from "@/components/RequestsPage";
export const Route = createFileRoute("/rfqs")({
  component: () => (
    <RequestsPage
      type="rfq"
      title="Requests for Quotation"
      description="Track incoming price requests and response deadlines."
    />
  ),
});
