import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";

function page(recipientId: string, message?: string) {
  const safeId = /^[0-9a-f-]{36}$/i.test(recipientId) ? recipientId : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Campaign email preferences · Gwero</title><style>body{margin:0;background:#f8fafc;color:#172033;font-family:ui-sans-serif,system-ui,sans-serif}.card{max-width:520px;margin:12vh auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;box-shadow:0 16px 50px rgba(15,23,42,.08)}h1{font-size:26px;margin:0 0 12px}p{line-height:1.6;color:#64748b}button{border:0;border-radius:10px;background:#4f46e5;color:#fff;padding:12px 18px;font-weight:600;cursor:pointer}.done{padding:12px;border-radius:10px;background:#ecfdf5;color:#047857}</style></head><body><main class="card"><h1>Email preferences</h1>${message ? `<p class="done">${message}</p>` : `<p>Confirm that you no longer want to receive campaign emails from Gwero Solutions. Direct replies and service messages are not affected.</p><form method="post"><input type="hidden" name="recipientId" value="${safeId}"><button type="submit" ${safeId ? "" : "disabled"}>Unsubscribe</button></form>`}</main></body></html>`;
}

export const Route = createFileRoute("/api/public/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const recipientId = new URL(request.url).searchParams.get("r") || "";
        return new Response(page(recipientId), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
      POST: async ({ request }) => {
        const body = await request.formData();
        const recipientId = String(body.get("recipientId") || "");
        if (!/^[0-9a-f-]{36}$/i.test(recipientId))
          return new Response(page("", "This unsubscribe link is invalid."), {
            status: 400,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        const { getPool } = await import("@/lib/db.server");
        const db = getPool();
        const [rows] = await db.execute(
          `SELECT r.campaign_id, COALESCE(pc.email, p.email) email
             FROM campaign_recipients r
             JOIN prospects p ON p.id = r.prospect_id
             LEFT JOIN prospect_contacts pc ON pc.id = r.contact_id
            WHERE r.id = ? LIMIT 1`,
          [recipientId],
        );
        const recipient = (rows as Array<{ campaign_id: string; email: string }>)[0];
        if (!recipient)
          return new Response(page("", "This unsubscribe link is no longer available."), {
            status: 404,
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        await db.execute(
          `INSERT INTO email_suppressions (id, email, reason, source, campaign_id)
           VALUES (?, ?, 'Unsubscribed', 'recipient', ?)
           ON DUPLICATE KEY UPDATE reason = 'Unsubscribed', source = 'recipient'`,
          [randomUUID(), recipient.email.toLowerCase(), recipient.campaign_id],
        );
        await db.execute(
          `UPDATE campaign_recipients SET status = 'stopped', stopped_reason = 'Unsubscribed'
            WHERE id = ?`,
          [recipientId],
        );
        await db.execute(
          `INSERT INTO campaign_events (id, campaign_id, recipient_id, event_type, detail)
           VALUES (?, ?, ?, 'recipient.unsubscribed', ?)`,
          [randomUUID(), recipient.campaign_id, recipientId, recipient.email],
        );
        return new Response(page(recipientId, "You have been unsubscribed successfully."), {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
