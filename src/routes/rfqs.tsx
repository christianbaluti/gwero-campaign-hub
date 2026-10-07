import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { OpportunityListPage } from "@/components/OpportunityListPage";
export const Route = createFileRoute("/rfqs")({
  component: RfqsRoute,
});
function RfqsRoute() {
  const location = useLocation();
  return location.pathname !== "/rfqs" && location.pathname !== "/rfqs/" ? (
    <Outlet />
  ) : (
    <OpportunityListPage kind="rfq" />
  );
}
