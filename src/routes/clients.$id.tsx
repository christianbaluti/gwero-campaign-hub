import { createFileRoute } from "@tanstack/react-router";
import { ClientWorkspace } from "@/components/ClientWorkspace";

export const Route = createFileRoute("/clients/$id")({ component: ClientDetailRoute });

function ClientDetailRoute() {
  const { id } = Route.useParams();
  return <ClientWorkspace id={id} />;
}
