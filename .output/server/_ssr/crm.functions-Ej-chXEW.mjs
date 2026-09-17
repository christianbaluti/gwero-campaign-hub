import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import { n as htmlToText, r as personalize } from "./personalize-BPwaxYCo.mjs";
import { t as getRequest } from "./request-response-BEPp1C2k.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crm.functions-Ej-chXEW.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function appOrigin() {
	const request = getRequest();
	const url = new URL(request.url);
	const forwarded = url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
	return forwarded ? `https://${forwarded}` : url.origin;
}
async function admin() {
	const { supabaseAdmin } = await import("./client.server-DZIQA0ow.mjs");
	return supabaseAdmin;
}
async function gatewayFetch(provider, secret, path, init) {
	let accessToken = secret.oauth_access_token;
	if (!accessToken) throw new Error("Reconnect this OAuth mailbox from Sending accounts.");
	if (secret.oauth_refresh_token && (!secret.oauth_expires_at || new Date(secret.oauth_expires_at).getTime() < Date.now() + 6e4)) {
		const google = provider === "gmail" || provider === "google";
		const clientId = process.env[google ? "GOOGLE_OAUTH_CLIENT_ID" : "MICROSOFT_OAUTH_CLIENT_ID"];
		const clientSecret = process.env[google ? "GOOGLE_OAUTH_CLIENT_SECRET" : "MICROSOFT_OAUTH_CLIENT_SECRET"];
		if (!clientId || !clientSecret) throw new Error("OAuth server credentials are missing.");
		const tokenUrl = google ? "https://oauth2.googleapis.com/token" : "https://login.microsoftonline.com/common/oauth2/v2.0/token";
		const body = new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			refresh_token: secret.oauth_refresh_token,
			grant_type: "refresh_token"
		});
		if (!google) body.set("scope", "openid email profile offline_access User.Read Mail.Read Mail.Send");
		const refreshed = await fetch(tokenUrl, {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body
		});
		if (!refreshed.ok) throw new Error("OAuth session expired. Reconnect this mailbox.");
		const tokens = await refreshed.json();
		accessToken = tokens.access_token;
		await (await admin()).from("mailbox_secrets").update({
			oauth_access_token: accessToken,
			oauth_refresh_token: tokens.refresh_token || secret.oauth_refresh_token,
			oauth_expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1e3).toISOString()
		}).eq("mailbox_id", secret.mailbox_id);
	}
	const base = provider === "gmail" || provider === "google" ? "https://gmail.googleapis.com" : "https://graph.microsoft.com/v1.0";
	const headers = new Headers(init?.headers);
	headers.set("authorization", `Bearer ${accessToken}`);
	return fetch(`${base}${path}`, {
		...init,
		headers
	});
}
var saveMailboxCredentials_createServerFn_handler = createServerRpc({
	id: "d1243d71da78a82bfebe95c8ee14f2799b998b370cbb4b06162c7df2bba55bd6",
	name: "saveMailboxCredentials",
	filename: "src/lib/crm.functions.ts"
}, (opts) => saveMailboxCredentials.__executeServer(opts));
var saveMailboxCredentials = createServerFn({ method: "POST" }).validator((data) => data).handler(saveMailboxCredentials_createServerFn_handler, async ({ data }) => {
	const db = await admin();
	const patch = {
		mailbox_id: data.mailboxId,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (data.smtpPassword) patch["smtp_password"] = data.smtpPassword;
	if (data.imapPassword) patch["imap_password"] = data.imapPassword;
	const { error } = await db.from("mailbox_secrets").upsert(patch, { onConflict: "mailbox_id" });
	if (error) throw new Error(error.message);
	return { ok: true };
});
var testMailbox_createServerFn_handler = createServerRpc({
	id: "307855ee0dc280ec0ec94fd24a9c973a760b8c14f9156e1833af787c03bceeac",
	name: "testMailbox",
	filename: "src/lib/crm.functions.ts"
}, (opts) => testMailbox.__executeServer(opts));
var testMailbox = createServerFn({ method: "POST" }).validator((data) => data).handler(testMailbox_createServerFn_handler, async ({ data }) => {
	const db = await admin();
	const { data: mailbox, error } = await db.from("mailboxes").select("*").eq("id", data.mailboxId).single();
	if (error || !mailbox) throw new Error("Mailbox not found");
	const results = [];
	if (mailbox.provider === "smtp") {
		const { data: secret } = await db.from("mailbox_secrets").select("*").eq("mailbox_id", mailbox.id).maybeSingle();
		const { smtpVerify } = await import("./smtp.server-jw_Ubbfl.mjs");
		await smtpVerify({
			host: mailbox.smtp_host ?? "",
			port: mailbox.smtp_port ?? 587,
			secure: mailbox.smtp_secure,
			username: mailbox.smtp_username ?? "",
			password: secret?.smtp_password ?? ""
		});
		results.push("Sending (SMTP) works");
		if (mailbox.imap_host) {
			const { imapVerify } = await import("./imap.server-mEz2XBuS.mjs");
			await imapVerify({
				host: mailbox.imap_host,
				port: mailbox.imap_port ?? 993,
				username: mailbox.imap_username ?? mailbox.smtp_username ?? "",
				password: secret?.imap_password ?? secret?.smtp_password ?? ""
			});
			results.push("Inbox (IMAP) works");
		}
	} else {
		const { data: secret } = await db.from("mailbox_secrets").select("*").eq("mailbox_id", mailbox.id).maybeSingle();
		if (!secret) throw new Error("OAuth credentials not found. Reconnect this account.");
		const path = mailbox.provider === "google" || mailbox.provider === "gmail" ? "/gmail/v1/users/me/profile" : "/me";
		if (!(await gatewayFetch(mailbox.provider, secret, path)).ok) throw new Error("Connected account check failed.");
		results.push("OAuth connection works");
	}
	await db.from("mailboxes").update({ last_status: results.join(" · ") }).eq("id", mailbox.id);
	return {
		ok: true,
		message: results.join(" · ")
	};
});
function trackHtml(html, recipientId, origin, opens, clicks) {
	let out = html;
	if (clicks) out = out.replace(/href="(https?:\/\/[^"]+)"/gi, (_m, url) => {
		return `href="${origin}/api/public/t/click?r=${recipientId}&u=${encodeURIComponent(url)}"`;
	});
	if (opens) out += `<img src="${origin}/api/public/t/open?r=${recipientId}" width="1" height="1" alt="" style="display:none" />`;
	return out;
}
var sendCampaign_createServerFn_handler = createServerRpc({
	id: "e24b89ad921066215313c042fc9f45b26546872420cc3501a56bf50e5e139668",
	name: "sendCampaign",
	filename: "src/lib/crm.functions.ts"
}, (opts) => sendCampaign.__executeServer(opts));
var sendCampaign = createServerFn({ method: "POST" }).validator((data) => data).handler(sendCampaign_createServerFn_handler, async ({ data }) => {
	const db = await admin();
	const origin = appOrigin();
	const { data: campaign, error: cErr } = await db.from("campaigns").select("*").eq("id", data.campaignId).single();
	if (cErr || !campaign) throw new Error("Campaign not found");
	if (!campaign.mailbox_id) throw new Error("Pick a sending account for this campaign first.");
	const { data: mailbox } = await db.from("mailboxes").select("*").eq("id", campaign.mailbox_id).single();
	if (!mailbox) throw new Error("Sending account not found");
	const { data: secret } = await db.from("mailbox_secrets").select("*").eq("mailbox_id", mailbox.id).maybeSingle();
	const { data: recipients } = await db.from("campaign_recipients").select("id, prospect_id, status, prospects(*)").eq("campaign_id", campaign.id).in("status", ["pending", "failed"]);
	if (!recipients?.length) throw new Error("No pending recipients in this campaign.");
	const attachmentList = campaign.attachments ?? [];
	const attachments = [];
	for (const att of attachmentList) {
		const { data: file } = await db.storage.from("attachments").download(att.path);
		if (file) attachments.push({
			filename: att.name,
			contentType: att.type || "application/octet-stream",
			content: new Uint8Array(await file.arrayBuffer())
		});
	}
	await db.from("campaigns").update({ status: "sending" }).eq("id", campaign.id);
	const { buildMime } = await import("./mime.server-CiENyIT4.mjs");
	let sent = 0;
	let failed = 0;
	for (const recipient of recipients) {
		const prospect = recipient.prospects;
		try {
			if (!prospect?.email) throw new Error("Prospect has no email address");
			const subject = personalize(campaign.subject, prospect);
			const html = trackHtml(personalize(campaign.body_html, prospect), recipient.id, origin, campaign.track_opens, campaign.track_clicks);
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
				messageId
			});
			if (mailbox.provider === "smtp") {
				const { smtpSend } = await import("./smtp.server-jw_Ubbfl.mjs");
				await smtpSend({
					host: mailbox.smtp_host ?? "",
					port: mailbox.smtp_port ?? 587,
					secure: mailbox.smtp_secure,
					username: mailbox.smtp_username ?? "",
					password: secret?.smtp_password ?? ""
				}, {
					from: mailbox.from_email,
					envelopeFrom: mailbox.from_email,
					to: prospect.email,
					cc: campaign.cc ?? [],
					bcc: campaign.bcc ?? [],
					raw
				});
			} else if (mailbox.provider === "gmail") {
				const encoded = Buffer.from(raw, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
				const res = await gatewayFetch("gmail", secret, "/gmail/v1/users/me/messages/send", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ raw: encoded })
				});
				if (!res.ok) throw new Error(await res.text());
			} else {
				const res = await gatewayFetch("outlook", secret, "/me/sendMail", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ message: {
						subject,
						body: {
							contentType: "HTML",
							content: html
						},
						toRecipients: [{ emailAddress: { address: prospect.email } }],
						ccRecipients: (campaign.cc ?? []).map((a) => ({ emailAddress: { address: a } })),
						bccRecipients: (campaign.bcc ?? []).map((a) => ({ emailAddress: { address: a } })),
						attachments: attachments.map((a) => ({
							"@odata.type": "#microsoft.graph.fileAttachment",
							name: a.filename,
							contentType: a.contentType,
							contentBytes: Buffer.from(a.content).toString("base64")
						}))
					} })
				});
				if (!res.ok) throw new Error(await res.text());
			}
			await db.from("campaign_recipients").update({
				status: "sent",
				sent_at: (/* @__PURE__ */ new Date()).toISOString(),
				error: null,
				message_id: messageId
			}).eq("id", recipient.id);
			await db.from("prospects").update({
				status: "contacted",
				updated_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", recipient.prospect_id).eq("status", "new");
			sent++;
		} catch (error) {
			failed++;
			await db.from("campaign_recipients").update({
				status: "failed",
				error: String(error.message).slice(0, 500)
			}).eq("id", recipient.id);
		}
	}
	await db.from("campaigns").update({
		status: "sent",
		sent_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", campaign.id);
	return {
		sent,
		failed
	};
});
function parseAddress(value) {
	return (/<([^>]+)>/.exec(value)?.[1] ?? value).trim().toLowerCase();
}
var syncReplies_createServerFn_handler = createServerRpc({
	id: "f3acac9464ff036e1b5b43d460c0641978540d4ec45b70b30e4acffb57c25496",
	name: "syncReplies",
	filename: "src/lib/crm.functions.ts"
}, (opts) => syncReplies.__executeServer(opts));
var syncReplies = createServerFn({ method: "POST" }).handler(syncReplies_createServerFn_handler, async () => {
	const db = await admin();
	const { data: mailboxes } = await db.from("mailboxes").select("*");
	if (!mailboxes?.length) return {
		imported: 0,
		checked: 0
	};
	const { data: prospects } = await db.from("prospects").select("id, email");
	const byEmail = new Map((prospects ?? []).map((p) => [p.email.toLowerCase(), p.id]));
	let imported = 0;
	for (const mailbox of mailboxes) {
		const messages = [];
		try {
			const { data: secret } = await db.from("mailbox_secrets").select("*").eq("mailbox_id", mailbox.id).maybeSingle();
			if (mailbox.provider === "smtp") {
				if (!mailbox.imap_host) continue;
				const { imapFetchRecent } = await import("./imap.server-mEz2XBuS.mjs");
				const headers = await imapFetchRecent({
					host: mailbox.imap_host,
					port: mailbox.imap_port ?? 993,
					username: mailbox.imap_username ?? mailbox.smtp_username ?? "",
					password: secret?.imap_password ?? secret?.smtp_password ?? ""
				});
				for (const h of headers) messages.push({
					id: `${mailbox.id}:${h.messageId || h.uid}`,
					from: parseAddress(h.from),
					subject: h.subject,
					snippet: h.subject,
					date: h.date ? new Date(h.date).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
				});
			} else if (mailbox.provider === "gmail") {
				const res = await gatewayFetch("gmail", secret, "/gmail/v1/users/me/messages?q=newer_than:14d%20in:inbox&maxResults=50");
				if (!res.ok) throw new Error(await res.text());
				const list = await res.json();
				for (const item of list.messages ?? []) {
					const detail = await gatewayFetch("gmail", secret, `/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
					if (!detail.ok) continue;
					const msg = await detail.json();
					const header = (name) => msg.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value ?? "";
					messages.push({
						id: `${mailbox.id}:${item.id}`,
						from: parseAddress(header("from")),
						subject: header("subject"),
						snippet: msg.snippet ?? "",
						date: header("date") ? new Date(header("date")).toISOString() : (/* @__PURE__ */ new Date()).toISOString()
					});
				}
			} else {
				const res = await gatewayFetch("outlook", secret, "/me/mailFolders/inbox/messages?$top=50&$select=id,subject,from,bodyPreview,receivedDateTime");
				if (!res.ok) throw new Error(await res.text());
				const list = await res.json();
				for (const m of list.value ?? []) messages.push({
					id: `${mailbox.id}:${m.id}`,
					from: (m.from?.emailAddress?.address ?? "").toLowerCase(),
					subject: m.subject,
					snippet: m.bodyPreview,
					date: m.receivedDateTime
				});
			}
			for (const message of messages) {
				const prospectId = byEmail.get(message.from);
				if (!prospectId) continue;
				const { data: recipientRow } = await db.from("campaign_recipients").select("id, campaign_id").eq("prospect_id", prospectId).eq("status", "sent").order("sent_at", { ascending: false }).limit(1).maybeSingle();
				const { error } = await db.from("replies").insert({
					mailbox_id: mailbox.id,
					prospect_id: prospectId,
					campaign_id: recipientRow?.campaign_id ?? null,
					from_email: message.from,
					subject: message.subject,
					snippet: message.snippet?.slice(0, 500),
					received_at: message.date,
					external_id: message.id
				});
				if (!error) {
					imported++;
					if (recipientRow) await db.from("campaign_recipients").update({ replied_at: message.date }).eq("id", recipientRow.id);
					await db.from("prospects").update({
						status: "replied",
						updated_at: (/* @__PURE__ */ new Date()).toISOString()
					}).eq("id", prospectId).in("status", ["new", "contacted"]);
				}
			}
			await db.from("mailboxes").update({
				last_sync_at: (/* @__PURE__ */ new Date()).toISOString(),
				last_status: "Inbox checked"
			}).eq("id", mailbox.id);
		} catch (error) {
			await db.from("mailboxes").update({ last_status: `Inbox check failed: ${String(error.message).slice(0, 200)}` }).eq("id", mailbox.id);
		}
	}
	return {
		imported,
		checked: mailboxes.length
	};
});
//#endregion
export { saveMailboxCredentials_createServerFn_handler, sendCampaign_createServerFn_handler, syncReplies_createServerFn_handler, testMailbox_createServerFn_handler };
