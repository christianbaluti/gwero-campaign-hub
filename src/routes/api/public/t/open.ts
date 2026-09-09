import { createFileRoute } from "@tanstack/react-router";

const PIXEL = Uint8Array.from(
  atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
  (c) => c.charCodeAt(0),
);

export const Route = createFileRoute("/api/public/t/open")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const recipientId = new URL(request.url).searchParams.get("r");
        if (recipientId) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: row } = await supabaseAdmin
              .from("campaign_recipients")
              .select("open_count, opened_at")
              .eq("id", recipientId)
              .maybeSingle();
            if (row) {
              await supabaseAdmin
                .from("campaign_recipients")
                .update({
                  open_count: (row.open_count ?? 0) + 1,
                  opened_at: row.opened_at ?? new Date().toISOString(),
                })
                .eq("id", recipientId);
            }
          } catch (error) {
            console.error("open tracking failed", error);
          }
        }
        return new Response(PIXEL, {
          headers: {
            "content-type": "image/gif",
            "cache-control": "no-store, no-cache, must-revalidate, private",
          },
        });
      },
    },
  },
});
