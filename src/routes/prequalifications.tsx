import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { OpportunityListPage } from "@/components/OpportunityListPage";

export const Route = createFileRoute("/prequalifications")({
  component: PrequalificationsPage,
  head: () => ({
    meta: [
      { title: "EOI & prequalification | Gwero OS" },
      {
        name: "description",
        content: "Build, collaborate on and submit EOI and prequalification responses.",
      },
      { property: "og:title", content: "EOI & prequalification | Gwero OS" },
      { property: "og:description", content: "Registrations and prequalification submissions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PrequalificationsPage() {
  const location = useLocation();
  return location.pathname !== "/prequalifications" &&
    location.pathname !== "/prequalifications/" ? (
    <Outlet />
  ) : (
    <OpportunityListPage kind="eoi" />
  );
}
