import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { personalize, htmlToText } from "./personalize";

type Json = Record<string, unknown>;

function appOrigin() {
  const request = getRequest();
  const url = new URL(request!.url);
  const forwarded = url.hostname === "localhost" ? request!.headers.get("x-forwarded-host") : null;
  return forwarded ? `https://${forwarded}` : url.origin;
}

async function admin() {
  const { serverDb } = await import("./db.server");
  return serverDb;
}

async function gatewayFetch(
  provider: string,
  secret: {
    mailbox_id: string;
    oauth_access_token?: string | null;
    oauth_refresh_token?: string | null;
    oauth_expires_at?: string | null;
  },
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let accessToken = secret.oauth_access_token;
  if (!accessToken) throw new Error("Reconnect this OAuth mailbox from Sending accounts.");
  if (
    secret.oauth_refresh_token &&
    (!secret.oauth_expires_at || new Date(secret.oauth_expires_at).getTime() < Date.now() + 60_000)
  ) {
    const google = provider === "gmail" || provider === "google";
    const { getSecret } = await import("./settings.server");
    const clientId = await getSecret(
      google ? "google_oauth_client_id" : "microsoft_oauth_client_id",
    );
    const clientSecret = await getSecret(
      google ? "google_oauth_client_secret" : "microsoft_oauth_client_secret",
    );
    if (!clientId || !clientSecret) throw new Error("OAuth server credentials are missing.");
    const tokenUrl = google
      ? "https://oauth2.googleapis.com/token"
      : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: secret.oauth_refresh_token,
      grant_type: "refresh_token",
    });
    if (!google)
      body.set("scope", "openid email profile offline_access User.Read Mail.Read Mail.Send");
    const refreshed = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!refreshed.ok) throw new Error("OAuth session expired. Reconnect this mailbox.");
    const tokens = (await refreshed.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };
    accessToken = tokens.access_token;
    const db = await admin();
    await db
      .from("mailbox_secrets")
      .update({
        oauth_access_token: accessToken,
        oauth_refresh_token: tokens.refresh_token || secret.oauth_refresh_token,
        oauth_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      } as never)
      .eq("mailbox_id", secret.mailbox_id);
  }
  const base =
    provider === "gmail" || provider === "google"
      ? "https://gmail.googleapis.com"
      : "https://graph.microsoft.com/v1.0";
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${accessToken}`);
  return fetch(`${base}${path}`, { ...init, headers });
}

/* ------------------------------------------------------------------ */
/* Mailbox credentials                                                 */
/* ------------------------------------------------------------------ */

export const saveMailboxCredentials = createServerFn({ method: "POST" })
  .validator((data: { mailboxId: string; smtpPassword?: string; imapPassword?: string }) => data)
  .handler(async ({ data }) => {
    const db = await admin();
    const patch: Json = { mailbox_id: data.mailboxId, updated_at: new Date().toISOString() };
    if (data.smtpPassword) patch["smtp_password"] = data.smtpPassword;
    if (data.imapPassword) patch["imap_password"] = data.imapPassword;
    const { error } = await db
      .from("mailbox_secrets")
      .upsert(patch as never, { onConflict: "mailbox_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testMailbox = createServerFn({ method: "POST" })
  .validator((data: { mailboxId: string }) => data)
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: mailbox, error } = await db
      .from("mailboxes")
      .select("*")
      .eq("id", data.mailboxId)
      .single();
    if (error || !mailbox) throw new Error("Mailbox not found");

    const results: string[] = [];
    if (mailbox.provider === "smtp") {
      const { data: secret } = await db
        .from("mailbox_secrets")
        .select("*")
        .eq("mailbox_id", mailbox.id)
        .maybeSingle();
      const { smtpVerify } = await import("./smtp.server");
      await smtpVerify({
        host: mailbox.smtp_host ?? "",
        port: mailbox.smtp_port ?? 587,
        secure: mailbox.smtp_secure,
        username: mailbox.smtp_username ?? "",
        password: secret?.smtp_password ?? "",
      });
      results.push("Sending (SMTP) works");
      if (mailbox.imap_host) {
        const { imapVerify } = await import("./imap.server");
        await imapVerify({
          host: mailbox.imap_host,
          port: mailbox.imap_port ?? 993,
          username: mailbox.imap_username ?? mailbox.smtp_username ?? "",
          password: secret?.imap_password ?? secret?.smtp_password ?? "",
        });
        results.push("Inbox (IMAP) works");
      }
    } else {
      const { data: secret } = await db
        .from("mailbox_secrets")
        .select("*")
        .eq("mailbox_id", mailbox.id)
        .maybeSingle();
      if (!secret) throw new Error("OAuth credentials not found. Reconnect this account.");
      const path =
        mailbox.provider === "google" || mailbox.provider === "gmail"
          ? "/gmail/v1/users/me/profile"
          : "/me";
      const response = await gatewayFetch(mailbox.provider, secret, path);
      if (!response.ok) throw new Error("Connected account check failed.");
      results.push("OAuth connection works");
    }

    await db
      .from("mailboxes")
      .update({ last_status: results.join(" · ") })
      .eq("id", mailbox.id);
    return { ok: true, message: results.join(" · ") };
  });

/* ------------------------------------------------------------------ */
/* Sending a campaign                                                  */
/* ------------------------------------------------------------------ */

function trackHtml(
  html: string,
  recipientId: string,
  origin: string,
  opens: boolean,
  clicks: boolean,
) {
  let out = html;
  if (clicks) {
    out = out.replace(/href="(https?:\/\/[^"]+)"/gi, (_m, url: string) => {
      return `href="${origin}/api/public/t/click?r=${recipientId}&u=${encodeURIComponent(url)}"`;
    });
  }
  if (opens) {
    out += `<img src="${origin}/api/public/t/open?r=${recipientId}" width="1" height="1" alt="" style="display:none" />`;
  }
  return out;
}

export const sendCampaign = createServerFn({ method: "POST" })
  .validator((data: { campaignId: string }) => data)
  .handler(async ({ data }) => {
    const db = await admin();
    const origin = appOrigin();

    const { data: campaign, error: cErr } = await db
      .from("campaigns")
      .select("*")
      .eq("id", data.campaignId)
      .single();
    if (cErr || !campaign) throw new Error("Campaign not found");
    if (!campaign.mailbox_id) throw new Error("Pick a sending account for this campaign first.");

    const { data: mailbox } = await db
      .from("mailboxes")
      .select("*")
      .eq("id", campaign.mailbox_id)
      .single();
    if (!mailbox) throw new Error("Sending account not found");

    const { data: secret } = await db
      .from("mailbox_secrets")
      .select("*")
      .eq("mailbox_id", mailbox.id)
      .maybeSingle();

    const { data: recipients } = await db
      .from("campaign_recipients")
      .select("id, prospect_id, status, prospects(*)")
      .eq("campaign_id", campaign.id)
      .in("status", ["pending", "failed"]);

    if (!recipients?.length) throw new Error("No pending recipients in this campaign.");

    // Load attachments once.
    const attachmentList =
      (campaign.attachments as unknown as Array<{
        path: string;
        name: string;
        type?: string;
      }>) ?? [];
    const attachments = [] as Array<{ filename: string; contentType: string; content: Uint8Array }>;
    for (const att of attachmentList) {
      try {
        const { readAttachment } = await import("./attachments.server");
        const file = await readAttachment(att.path);
        attachments.push({
          filename: att.name,
          contentType: att.type || "application/octet-stream",
          content: new Uint8Array(file),
        });
      } catch (error) {
        throw new Error(`Attachment ${att.name} is unavailable: ${String(error)}`);
      }
    }

    await db.from("campaigns").update({ status: "sending" }).eq("id", campaign.id);

    const { buildMime } = await import("./mime.server");
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const prospect = recipient.prospects as unknown as Parameters<typeof personalize>[1] & {
        email: string;
      };
      try {
        if (!prospect?.email) throw new Error("Prospect has no email address");
        const subject = personalize(campaign.subject, prospect);
        const html = trackHtml(
          personalize(campaign.body_html, prospect),
          recipient.id,
          origin,
          campaign.track_opens,
          campaign.track_clicks,
        );
        const text = htmlToText(html);
        const messageId = `<${recipient.id}@gwero-crm>`;

        const raw = buildMime({
          from: mailbox.from_email,
          fromName: mailbox.from_name,
          to: prospect.email,
          cc: campaign.cc ?? [],
          subject,
          html,
          text,
          attachments,
          messageId,
        });

        if (mailbox.provider === "smtp") {
          const { smtpSend } = await import("./smtp.server");
          await smtpSend(
            {
              host: mailbox.smtp_host ?? "",
              port: mailbox.smtp_port ?? 587,
              secure: mailbox.smtp_secure,
              username: mailbox.smtp_username ?? "",
              password: secret?.smtp_password ?? "",
            },
            {
              from: mailbox.from_email,
              envelopeFrom: mailbox.from_email,
              to: prospect.email,
              cc: campaign.cc ?? [],
              bcc: campaign.bcc ?? [],
              raw,
            },
          );
        } else if (mailbox.provider === "gmail") {
          const encoded = Buffer.from(raw, "utf8")
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
          const res = await gatewayFetch("gmail", secret!, "/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ raw: encoded }),
          });
          if (!res.ok) throw new Error(await res.text());
        } else {
          const res = await gatewayFetch("outlook", secret!, "/me/sendMail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: {
                subject,
                body: { contentType: "HTML", content: html },
                toRecipients: [{ emailAddress: { address: prospect.email } }],
                ccRecipients: (campaign.cc ?? []).map((a: string) => ({
                  emailAddress: { address: a },
                })),
                bccRecipients: (campaign.bcc ?? []).map((a: string) => ({
                  emailAddress: { address: a },
                })),
                attachments: attachments.map((a) => ({
                  "@odata.type": "#microsoft.graph.fileAttachment",
                  name: a.filename,
                  contentType: a.contentType,
                  contentBytes: Buffer.from(a.content).toString("base64"),
                })),
              },
            }),
          });
          if (!res.ok) throw new Error(await res.text());
        }

        await db
          .from("campaign_recipients")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            error: null,
            message_id: messageId,
          })
          .eq("id", recipient.id);
        await db
          .from("prospects")
          .update({ status: "contacted", updated_at: new Date().toISOString() })
          .eq("id", recipient.prospect_id)
          .eq("status", "new");
        sent++;
      } catch (error) {
        failed++;
        await db
          .from("campaign_recipients")
          .update({ status: "failed", error: String((error as Error).message).slice(0, 500) })
          .eq("id", recipient.id);
      }
    }

    await db
      .from("campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", campaign.id);

    return { sent, failed };
  });

/* ------------------------------------------------------------------ */
/* Pulling replies back in                                             */
/* ------------------------------------------------------------------ */

function parseAddress(value: string) {
  const match = /<([^>]+)>/.exec(value);
  return (match?.[1] ?? value).trim().toLowerCase();
}

export const syncReplies = createServerFn({ method: "POST" }).handler(async () => {
  const db = await admin();
  const { data: mailboxes } = await db.from("mailboxes").select("*");
  if (!mailboxes?.length) return { imported: 0, checked: 0 };

  const { data: prospects } = await db.from("prospects").select("id, email");
  const byEmail = new Map((prospects ?? []).map((p) => [p.email.toLowerCase(), p.id]));

  let imported = 0;
  for (const mailbox of mailboxes) {
    const messages: Array<{
      id: string;
      from: string;
      subject: string;
      snippet: string;
      date: string;
    }> = [];
    try {
      const { data: secret } = await db
        .from("mailbox_secrets")
        .select("*")
        .eq("mailbox_id", mailbox.id)
        .maybeSingle();
      if (mailbox.provider === "smtp") {
        if (!mailbox.imap_host) continue;
        const { imapFetchRecent } = await import("./imap.server");
        const headers = await imapFetchRecent({
          host: mailbox.imap_host,
          port: mailbox.imap_port ?? 993,
          username: mailbox.imap_username ?? mailbox.smtp_username ?? "",
          password: secret?.imap_password ?? secret?.smtp_password ?? "",
        });
        for (const h of headers) {
          messages.push({
            id: `${mailbox.id}:${h.messageId || h.uid}`,
            from: parseAddress(h.from),
            subject: h.subject,
            snippet: h.subject,
            date: h.date ? new Date(h.date).toISOString() : new Date().toISOString(),
          });
        }
      } else if (mailbox.provider === "gmail") {
        const res = await gatewayFetch(
          "gmail",
          secret!,
          "/gmail/v1/users/me/messages?q=newer_than:14d%20in:inbox&maxResults=50",
        );
        if (!res.ok) throw new Error(await res.text());
        const list = (await res.json()) as { messages?: Array<{ id: string }> };
        for (const item of list.messages ?? []) {
          const detail = await gatewayFetch(
            "gmail",
            secret!,
            `/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          );
          if (!detail.ok) continue;
          const msg = (await detail.json()) as {
            snippet?: string;
            payload?: { headers?: Array<{ name: string; value: string }> };
          };
          const header = (name: string) =>
            msg.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value ?? "";
          messages.push({
            id: `${mailbox.id}:${item.id}`,
            from: parseAddress(header("from")),
            subject: header("subject"),
            snippet: msg.snippet ?? "",
            date: header("date")
              ? new Date(header("date")).toISOString()
              : new Date().toISOString(),
          });
        }
      } else {
        const res = await gatewayFetch(
          "outlook",
          secret!,
          "/me/mailFolders/inbox/messages?$top=50&$select=id,subject,from,bodyPreview,receivedDateTime",
        );
        if (!res.ok) throw new Error(await res.text());
        const list = (await res.json()) as {
          value?: Array<{
            id: string;
            subject: string;
            bodyPreview: string;
            receivedDateTime: string;
            from?: { emailAddress?: { address?: string } };
          }>;
        };
        for (const m of list.value ?? []) {
          messages.push({
            id: `${mailbox.id}:${m.id}`,
            from: (m.from?.emailAddress?.address ?? "").toLowerCase(),
            subject: m.subject,
            snippet: m.bodyPreview,
            date: m.receivedDateTime,
          });
        }
      }

      for (const message of messages) {
        const prospectId = byEmail.get(message.from);
        if (!prospectId) continue;
        const { data: recipientRow } = await db
          .from("campaign_recipients")
          .select("id, campaign_id")
          .eq("prospect_id", prospectId)
          .eq("status", "sent")
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error } = await db.from("replies").insert({
          mailbox_id: mailbox.id,
          prospect_id: prospectId,
          campaign_id: recipientRow?.campaign_id ?? null,
          from_email: message.from,
          subject: message.subject,
          snippet: message.snippet?.slice(0, 500),
          received_at: message.date,
          external_id: message.id,
        });
        if (!error) {
          imported++;
          if (recipientRow) {
            await db
              .from("campaign_recipients")
              .update({ replied_at: message.date })
              .eq("id", recipientRow.id);
          }
          await db
            .from("prospects")
            .update({ status: "replied", updated_at: new Date().toISOString() })
            .eq("id", prospectId)
            .in("status", ["new", "contacted"]);
        }
      }

      await db
        .from("mailboxes")
        .update({ last_sync_at: new Date().toISOString(), last_status: "Inbox checked" })
        .eq("id", mailbox.id);
    } catch (error) {
      await db
        .from("mailboxes")
        .update({
          last_status: `Inbox check failed: ${String((error as Error).message).slice(0, 200)}`,
        })
        .eq("id", mailbox.id);
    }
  }

  return { imported, checked: mailboxes.length };
});
