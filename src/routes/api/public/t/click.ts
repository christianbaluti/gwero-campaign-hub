import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/t/click")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const recipientId = params.get("r");
        const target = params.get("u");
        let destination = "https://example.com";
        if (target && /^https?:\/\//i.test(target)) destination = target;

        if (recipientId) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: row } = await supabaseAdmin
              .from("campaign_recipients")
              .select("click_count, clicked_at")
              .eq("id", recipientId)
              .maybeSingle();
            if (row) {
              await supabaseAdmin
                .from("campaign_recipients")
                .update({
                  click_count: (row.click_count ?? 0) + 1,
                  clicked_at: row.clicked_at ?? new Date().toISOString(),
                })
                .eq("id", recipientId);
            }
          } catch (error) {
            console.error("click tracking failed", error);
          }
        }

        return new Response(null, { status: 302, headers: { location: destination } });
      },
    },
  },
});
