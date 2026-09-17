import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/oauth/google/start")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/oauth-mail.server")).beginMailOAuth("google", request),
    },
  },
});
