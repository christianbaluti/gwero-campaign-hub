import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/oauth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/oauth-mail.server")).finishMailOAuth("google", request),
    },
  },
});
