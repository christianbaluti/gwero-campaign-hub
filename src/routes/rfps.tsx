import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { OpportunityListPage } from "@/components/OpportunityListPage";
export const Route = createFileRoute("/rfps")({
  component: RfpsRoute,
});
function RfpsRoute() {
  const location = useLocation();
  return location.pathname !== "/rfps" && location.pathname !== "/rfps/" ? (
    <Outlet />
  ) : (
    <OpportunityListPage kind="rfp" />
  );
}
