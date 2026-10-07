import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { OpportunityListPage } from "@/components/OpportunityListPage";

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
  const location = useLocation();
  return location.pathname !== "/bids" && location.pathname !== "/bids/" ? (
    <Outlet />
  ) : (
    <OpportunityListPage kind="bid" />
  );
}
