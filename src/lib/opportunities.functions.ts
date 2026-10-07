import { createServerFn } from "@tanstack/react-start";
import { authMiddleware, permissionMiddleware } from "./auth.middleware";

export type OpportunityKind = "rfp" | "rfq" | "bid";

export type OpportunityInput = {
  id?: string;
  kind: OpportunityKind;
  title: string;
  reference?: string;
  clientId?: string;
  status?: string;
  receivedDate?: string;
  dueDate?: string;
  value?: number;
  currency?: string;
  notes?: string;
  submissionType: "email" | "hand_delivery" | "portal";
  submissionEmail?: string;
  submissionCc?: string;
  deliveryLocation?: string;
  portalUrl?: string;
  portalUsername?: string;
  submissionInstructions?: string;
  submissionTime?: string;
};

type AttachmentMeta = { path: string; name: string; type: string; size: number };
type SerializableValue =
  string | number | boolean | null | SerializableValue[] | { [key: string]: SerializableValue };
type SerializableRecord = { [key: string]: SerializableValue };

function assertKind(kind: string): asserts kind is OpportunityKind {
  if (!["rfp", "rfq", "bid"].includes(kind)) throw new Error("Invalid opportunity type");
}

async function pool() {
  return (await import("./db.server")).getPool();
}

function rows<T = SerializableRecord>(result: unknown): T[] {
  return (result as [T[]])[0];
}

function serial<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function splitEmails(value?: string | null) {
  return (value || "")
    .split(/[;,]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function assertEmail(value: string, label: string) {
  if (/\r|\n/.test(value) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    throw new Error(`${label} is not a valid email address.`);
}

function safeFilename(value: string) {
  return value.replace(/["\\\r\n]/g, "_").trim() || "attachment";
}

export const listOpportunityDependencies = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = await pool();
    const [clients, currencies, documents, users, mailboxes, costSheets] = await Promise.all([
      db.query(
        "SELECT id, name, company, logo_path, email FROM clients ORDER BY COALESCE(company, name)",
      ),
      db.query(
        "SELECT * FROM currencies WHERE is_active = TRUE ORDER BY is_default DESC, sort_order, code",
      ),
      db.query(
        "SELECT id, title, category, owner, version, file_url FROM documents ORDER BY updated_at DESC",
      ),
      db.query(
        "SELECT id, full_name, email FROM system_users WHERE status = 'active' ORDER BY full_name",
      ),
      db.query(
        "SELECT id, name, from_email, provider, is_default FROM mailboxes ORDER BY is_default DESC, name",
      ),
      db.query(
        "SELECT id, name, client_id, status, currency FROM cost_sheets ORDER BY updated_at DESC",
      ),
    ]);
    return serial({
      clients: rows(clients),
      currencies: rows(currencies),
      documents: rows(documents),
      users: rows(users),
      mailboxes: rows(mailboxes),
      costSheets: rows(costSheets),
    });
  });

export const listOpportunities = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: { kind: OpportunityKind }) => data)
  .handler(async ({ data }) => {
    assertKind(data.kind);
    const db = await pool();
    const query =
      data.kind === "bid"
        ? `SELECT b.id, b.title, b.reference, b.status, b.closing_date AS due_date,
                  b.value, b.currency, b.submission_type, c.name AS client_name,
                  c.company AS client_company, c.logo_path AS client_logo
             FROM bids b LEFT JOIN clients c ON c.id = b.client_id
            ORDER BY b.created_at DESC`
        : `SELECT r.id, r.title, r.reference, r.status, r.due_date,
                  r.value, r.currency, r.submission_type, c.name AS client_name,
                  c.company AS client_company, c.logo_path AS client_logo
             FROM requests r LEFT JOIN clients c ON c.id = r.client_id
            WHERE r.request_type = ? ORDER BY r.created_at DESC`;
    return serial(
      rows<SerializableRecord>(await db.query(query, data.kind === "bid" ? [] : [data.kind])),
    );
  });

export const createOpportunity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: OpportunityInput & { sourceDocuments?: AttachmentMeta[] }) => data)
  .handler(async ({ data, context }) => {
    assertKind(data.kind);
    if (!data.title.trim()) throw new Error("Add the opportunity name.");
    if (!data.clientId) throw new Error("Choose a client.");
    const db = await pool();
    const id = data.id || crypto.randomUUID();
    const common = [
      data.reference?.trim() || null,
      data.title.trim(),
      data.clientId,
      data.status || "received",
      data.dueDate || null,
      Number(data.value || 0),
      data.currency || "MWK",
      data.notes?.trim() || null,
      data.submissionType,
      data.submissionEmail?.trim() || null,
      JSON.stringify(splitEmails(data.submissionCc)),
      data.deliveryLocation?.trim() || null,
      data.portalUrl?.trim() || null,
      data.portalUsername?.trim() || null,
      data.submissionInstructions?.trim() || null,
      data.submissionTime || null,
    ];
    if (data.kind === "bid") {
      await db.execute(
        `INSERT INTO bids
          (id, reference, title, client_id, status, closing_date, value, currency, notes,
           submission_type, submission_email, submission_cc, delivery_location, portal_url,
           portal_username, submission_instructions, submission_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ...common],
      );
    } else {
      await db.execute(
        `INSERT INTO requests
          (id, reference, title, client_id, status, due_date, value, currency, notes,
           submission_type, submission_email, submission_cc, delivery_location, portal_url,
           portal_username, submission_instructions, submission_time, request_type, received_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, ...common, data.kind, data.receivedDate || null],
      );
    }
    for (const file of data.sourceDocuments || []) {
      if (!file.path.startsWith(`${id}/`)) continue;
      await db.execute(
        `INSERT INTO opportunity_documents
          (id, opportunity_type, opportunity_id, attachment_path, display_name, content_type,
           file_size, document_role, include_in_submission, outgoing_name, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'source', FALSE, ?, ?)`,
        [
          crypto.randomUUID(),
          data.kind,
          id,
          file.path,
          file.name,
          file.type,
          file.size,
          file.name,
          context.user.id,
        ],
      );
    }
    return { id };
  });

export const getOpportunityWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: { kind: OpportunityKind; id: string }) => data)
  .handler(async ({ data }) => {
    assertKind(data.kind);
    const db = await pool();
    const table = data.kind === "bid" ? "bids" : "requests";
    const [opportunity, checklist, replies, documents, comments, submissions] = await Promise.all([
      db.query(
        `SELECT o.*, c.name AS client_name, c.company AS client_company,
                c.logo_path AS client_logo, c.email AS client_email, cs.name AS cost_sheet_name
           FROM ${table} o LEFT JOIN clients c ON c.id = o.client_id
           LEFT JOIN cost_sheets cs ON cs.id = o.cost_sheet_id
          WHERE o.id = ? ${data.kind === "bid" ? "" : "AND o.request_type = ?"} LIMIT 1`,
        data.kind === "bid" ? [data.id] : [data.id, data.kind],
      ),
      db.query(
        `SELECT i.*, u.full_name AS assignee_name
           FROM opportunity_checklist_items i LEFT JOIN system_users u ON u.id = i.assignee_id
          WHERE opportunity_type = ? AND opportunity_id = ? ORDER BY position, created_at`,
        [data.kind, data.id],
      ),
      db.query(
        `SELECT id, from_email, subject, snippet, body, body_html, attachments, received_at
           FROM replies WHERE opportunity_type = ? AND opportunity_id = ?
          ORDER BY received_at DESC`,
        [data.kind, data.id],
      ),
      db.query(
        `SELECT od.*, d.category, d.owner, d.version
           FROM opportunity_documents od LEFT JOIN documents d ON d.id = od.document_id
          WHERE od.opportunity_type = ? AND od.opportunity_id = ? ORDER BY od.created_at`,
        [data.kind, data.id],
      ),
      db.query(
        `SELECT c.*, u.full_name AS author_name
           FROM opportunity_comments c LEFT JOIN system_users u ON u.id = c.author_id
          WHERE opportunity_type = ? AND opportunity_id = ? ORDER BY c.created_at DESC`,
        [data.kind, data.id],
      ),
      db.query(
        `SELECT s.*, u.full_name AS submitted_by_name, m.from_email AS mailbox_email
           FROM opportunity_submissions s
           LEFT JOIN system_users u ON u.id = s.submitted_by
           LEFT JOIN mailboxes m ON m.id = s.mailbox_id
          WHERE opportunity_type = ? AND opportunity_id = ? ORDER BY s.created_at DESC`,
        [data.kind, data.id],
      ),
    ]);
    const record = rows<SerializableRecord>(opportunity)[0];
    if (!record) throw new Error("Opportunity not found.");
    return serial({
      opportunity: record,
      checklist: rows(checklist),
      documents: rows(documents),
      comments: rows(comments),
      submissions: rows(submissions),
      replies: rows(replies),
    });
  });

export const updateOpportunity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: OpportunityInput & { id: string }) => data)
  .handler(async ({ data }) => {
    assertKind(data.kind);
    const db = await pool();
    const table = data.kind === "bid" ? "bids" : "requests";
    const dueColumn = data.kind === "bid" ? "closing_date" : "due_date";
    await db.execute(
      `UPDATE ${table} SET title = ?, reference = ?, client_id = ?, status = ?, ${dueColumn} = ?,
        value = ?, currency = ?, notes = ?, submission_type = ?, submission_email = ?,
        submission_cc = ?, delivery_location = ?, portal_url = ?, portal_username = ?,
        submission_instructions = ?, submission_time = ? WHERE id = ?`,
      [
        data.title.trim(),
        data.reference?.trim() || null,
        data.clientId || null,
        data.status || "received",
        data.dueDate || null,
        Number(data.value || 0),
        data.currency || "MWK",
        data.notes?.trim() || null,
        data.submissionType,
        data.submissionEmail?.trim() || null,
        JSON.stringify(splitEmails(data.submissionCc)),
        data.deliveryLocation?.trim() || null,
        data.portalUrl?.trim() || null,
        data.portalUsername?.trim() || null,
        data.submissionInstructions?.trim() || null,
        data.submissionTime || null,
        data.id,
      ],
    );
    return { ok: true };
  });

export const saveChecklistItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      id?: string;
      kind: OpportunityKind;
      opportunityId: string;
      title: string;
      notes?: string;
      assigneeId?: string;
      dueAt?: string;
      documentRequired?: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    assertKind(data.kind);
    const db = await pool();
    if (!data.title.trim()) throw new Error("Add a checklist item name.");
    const id = data.id || crypto.randomUUID();
    await db.execute(
      `INSERT INTO opportunity_checklist_items
        (id, opportunity_type, opportunity_id, title, notes, assignee_id, due_at, document_required, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), notes = VALUES(notes),
         assignee_id = VALUES(assignee_id), due_at = VALUES(due_at), document_required = VALUES(document_required)`,
      [
        id,
        data.kind,
        data.opportunityId,
        data.title.trim(),
        data.notes?.trim() || null,
        data.assigneeId || null,
        data.dueAt || null,
        data.documentRequired !== false,
        context.user.id,
      ],
    );
    if (data.assigneeId && data.assigneeId !== context.user.id) {
      await db.execute(
        `INSERT INTO notifications
          (id, user_id, notification_type, title, body, action_url, entity_type, entity_id)
         VALUES (?, ?, 'opportunity.assignment', ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          data.assigneeId,
          `New ${data.kind.toUpperCase()} requirement assigned`,
          data.title.trim(),
          `/${data.kind === "bid" ? "bids" : `${data.kind}s`}/${data.opportunityId}`,
          data.kind,
          data.opportunityId,
        ],
      );
    }
    return { id };
  });

export const setChecklistStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; complete: boolean }) => data)
  .handler(async ({ data, context }) => {
    const db = await pool();
    if (data.complete) {
      const item = rows<{ document_required: number }>(
        await db.query(
          "SELECT document_required FROM opportunity_checklist_items WHERE id = ? LIMIT 1",
          [data.id],
        ),
      )[0];
      if (item?.document_required) {
        const linked = rows<{ count: number }>(
          await db.query(
            "SELECT COUNT(*) AS count FROM opportunity_documents WHERE checklist_item_id = ?",
            [data.id],
          ),
        )[0]?.count;
        if (!Number(linked))
          throw new Error("Attach the required document before completing this item.");
      }
    }
    await db.execute(
      `UPDATE opportunity_checklist_items SET status = ?, completed_by = ?, completed_at = ? WHERE id = ?`,
      data.complete
        ? ["complete", context.user.id, new Date(), data.id]
        : ["pending", null, null, data.id],
    );
    return { ok: true };
  });

export const deleteChecklistItem = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await (await pool()).execute("DELETE FROM opportunity_checklist_items WHERE id = ?", [data.id]);
    return { ok: true };
  });

export const addOpportunityDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      kind: OpportunityKind;
      opportunityId: string;
      checklistItemId?: string;
      documentId?: string;
      attachment?: AttachmentMeta;
      displayName: string;
      role?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    assertKind(data.kind);
    if (!data.documentId && !data.attachment) throw new Error("Choose or upload a document.");
    if (data.attachment && !data.attachment.path.startsWith(`${data.opportunityId}/`))
      throw new Error("Invalid attachment.");
    const db = await pool();
    let attachment = data.attachment;
    if (!attachment && data.documentId) {
      const document = rows<{ title: string; file_url: string | null }>(
        await db.query("SELECT title, file_url FROM documents WHERE id = ? LIMIT 1", [
          data.documentId,
        ]),
      )[0];
      const match = document?.file_url?.match(/\/api\/attachments\/([^/]+)\/([^/?#]+)/);
      if (match) {
        const file = rows<{ file_name: string; content_type: string; file_size: number }>(
          await db.query(
            "SELECT file_name, content_type, file_size FROM attachment_files WHERE owner_id = ? AND id = ? LIMIT 1",
            [decodeURIComponent(match[1] || ""), decodeURIComponent(match[2] || "")],
          ),
        )[0];
        if (file)
          attachment = {
            path: `${decodeURIComponent(match[1] || "")}/${decodeURIComponent(match[2] || "")}`,
            name: file.file_name,
            type: file.content_type,
            size: file.file_size,
          };
      }
    }
    await db.execute(
      `INSERT INTO opportunity_documents
        (id, opportunity_type, opportunity_id, checklist_item_id, document_id, attachment_path,
         display_name, content_type, file_size, document_role, outgoing_name, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        data.kind,
        data.opportunityId,
        data.checklistItemId || null,
        data.documentId || null,
        attachment?.path || null,
        data.displayName,
        attachment?.type || null,
        attachment?.size || null,
        data.role || "response",
        data.displayName,
        context.user.id,
      ],
    );
    return { ok: true };
  });

export const updateOpportunityDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string; outgoingName: string; include: boolean }) => data)
  .handler(async ({ data }) => {
    await (
      await pool()
    ).execute(
      "UPDATE opportunity_documents SET outgoing_name = ?, include_in_submission = ? WHERE id = ?",
      [data.outgoingName.trim(), data.include, data.id],
    );
    return { ok: true };
  });

export const deleteOpportunityDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await (await pool()).execute("DELETE FROM opportunity_documents WHERE id = ?", [data.id]);
    return { ok: true };
  });

export const addOpportunityComment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { kind: OpportunityKind; opportunityId: string; body: string }) => data)
  .handler(async ({ data, context }) => {
    assertKind(data.kind);
    if (!data.body.trim()) throw new Error("Write a note first.");
    await (
      await pool()
    ).execute(
      `INSERT INTO opportunity_comments (id, opportunity_type, opportunity_id, body, author_id)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), data.kind, data.opportunityId, data.body.trim(), context.user.id],
    );
    return { ok: true };
  });

export const linkCostSheet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      kind: OpportunityKind;
      opportunityId: string;
      costSheetId?: string;
      create?: { name: string; clientId?: string; currency: string; notes?: string };
    }) => data,
  )
  .handler(async ({ data }) => {
    assertKind(data.kind);
    const db = await pool();
    let id = data.costSheetId || null;
    if (data.create) {
      id = crypto.randomUUID();
      await db.execute(
        `INSERT INTO cost_sheets (id, name, client_id, bid_id, status, currency, notes)
         VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
        [
          id,
          data.create.name,
          data.create.clientId || null,
          data.kind === "bid" ? data.opportunityId : null,
          data.create.currency,
          data.create.notes || null,
        ],
      );
    }
    const table = data.kind === "bid" ? "bids" : "requests";
    await db.execute(`UPDATE ${table} SET cost_sheet_id = ? WHERE id = ?`, [
      id,
      data.opportunityId,
    ]);
    return { id };
  });

export const submitOpportunity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      kind: OpportunityKind;
      opportunityId: string;
      channel: "email" | "hand_delivery" | "portal";
      mailboxId?: string;
      recipientEmail?: string;
      cc?: string;
      subject?: string;
      bodyHtml?: string;
      bodyText?: string;
      fileMode?: "separate" | "merged";
    }) => data,
  )
  .handler(async ({ data, context }) => {
    assertKind(data.kind);
    const db = await pool();
    const pending =
      rows<{ count: number }>(
        await db.query(
          "SELECT COUNT(*) AS count FROM opportunity_checklist_items WHERE opportunity_type = ? AND opportunity_id = ? AND status <> 'complete'",
          [data.kind, data.opportunityId],
        ),
      )[0]?.count || 0;
    if (Number(pending) > 0) throw new Error("Complete every checklist item before submission.");
    const table = data.kind === "bid" ? "bids" : "requests";
    const opportunity = rows<SerializableRecord>(
      await db.query(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [data.opportunityId]),
    )[0];
    if (!opportunity) throw new Error("Opportunity not found.");
    const submissionId = crypto.randomUUID();
    let messageId: string | null = null;
    if (data.channel === "email") {
      if (
        !data.mailboxId ||
        !data.recipientEmail ||
        !data.subject?.trim() ||
        !data.bodyHtml?.trim()
      )
        throw new Error("Choose a mailbox and add the recipient, subject and message.");
      assertEmail(data.recipientEmail, "Recipient");
      splitEmails(data.cc).forEach((email) => assertEmail(email, "CC address"));
      const mailbox = rows<SerializableRecord>(
        await db.query("SELECT * FROM mailboxes WHERE id = ? LIMIT 1", [data.mailboxId]),
      )[0];
      const secret = rows<SerializableRecord>(
        await db.query("SELECT * FROM mailbox_secrets WHERE mailbox_id = ? LIMIT 1", [
          data.mailboxId,
        ]),
      )[0];
      if (!mailbox) throw new Error("Sending account not found.");
      const fileRows = rows<Record<string, unknown>>(
        await db.query(
          `SELECT od.*, af.content FROM opportunity_documents od
         LEFT JOIN attachment_files af ON CONCAT(af.owner_id, '/', af.id) = od.attachment_path
         WHERE od.opportunity_type = ? AND od.opportunity_id = ? AND od.include_in_submission = TRUE`,
          [data.kind, data.opportunityId],
        ),
      );
      let attachments = fileRows
        .filter((file) => file["content"])
        .map((file) => ({
          filename: safeFilename(String(file["outgoing_name"] || file["display_name"])),
          contentType: String(file["content_type"] || "application/octet-stream"),
          content: file["content"] as unknown as Uint8Array,
        }));
      const missingFiles = fileRows.filter((file) => !file["content"]);
      if (missingFiles.length)
        throw new Error(
          `Upload a managed file for: ${missingFiles.map((file) => String(file["display_name"])).join(", ")}. Linked document records without uploaded content cannot be emailed.`,
        );
      if (data.fileMode === "merged" && attachments.length) {
        if (attachments.some((file) => file.contentType !== "application/pdf"))
          throw new Error(
            "Only PDF documents can be merged. Choose separate files or replace non-PDF files.",
          );
        const { PDFDocument } = await import("pdf-lib");
        const merged = await PDFDocument.create();
        for (const file of attachments) {
          const source = await PDFDocument.load(file.content);
          const pages = await merged.copyPages(source, source.getPageIndices());
          pages.forEach((page) => merged.addPage(page));
        }
        attachments = [
          {
            filename: `${String(opportunity["title"])} submission.pdf`,
            contentType: "application/pdf",
            content: await merged.save(),
          },
        ];
      }
      messageId = `<${crypto.randomUUID()}@gwero-crm>`;
      const { buildMime } = await import("./mime.server");
      const raw = buildMime({
        from: String(mailbox["from_email"]),
        fromName: String(mailbox["from_name"] || ""),
        to: data.recipientEmail,
        cc: splitEmails(data.cc),
        subject: data.subject.trim(),
        html: data.bodyHtml,
        text: data.bodyText || data.bodyHtml.replace(/<[^>]+>/g, " "),
        attachments,
        messageId,
      });
      const provider = String(mailbox["provider"]);
      if (provider === "smtp") {
        const { smtpSend } = await import("./smtp.server");
        await smtpSend(
          {
            host: String(mailbox["smtp_host"] || ""),
            port: Number(mailbox["smtp_port"] || 587),
            secure: Boolean(mailbox["smtp_secure"]),
            username: String(mailbox["smtp_username"] || ""),
            password: String(secret?.["smtp_password"] || ""),
          },
          {
            from: String(mailbox["from_email"]),
            envelopeFrom: String(mailbox["from_email"]),
            to: data.recipientEmail,
            cc: splitEmails(data.cc),
            bcc: [],
            raw,
          },
        );
      } else if (provider === "gmail" || provider === "google") {
        const { gatewayFetch } = await import("./crm.functions");
        const encoded = Buffer.from(raw)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        const response = await gatewayFetch(
          provider,
          secret as never,
          "/gmail/v1/users/me/messages/send",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ raw: encoded }),
          },
        );
        if (!response.ok) throw new Error("Gmail could not send this submission.");
      } else {
        const { gatewayFetch } = await import("./crm.functions");
        const response = await gatewayFetch(provider, secret as never, "/me/sendMail", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: {
              subject: data.subject,
              body: { contentType: "HTML", content: data.bodyHtml },
              toRecipients: [{ emailAddress: { address: data.recipientEmail } }],
              ccRecipients: splitEmails(data.cc).map((address) => ({ emailAddress: { address } })),
              attachments: attachments.map((file) => ({
                "@odata.type": "#microsoft.graph.fileAttachment",
                name: file.filename,
                contentType: file.contentType,
                contentBytes: Buffer.from(file.content).toString("base64"),
              })),
            },
          }),
        });
        if (!response.ok) throw new Error("Microsoft 365 could not send this submission.");
      }
    }
    await db.execute(
      `INSERT INTO opportunity_submissions
        (id, opportunity_type, opportunity_id, channel, status, mailbox_id, recipient_email, cc,
         subject, body_html, file_mode, detail, external_message_id, submitted_by, submitted_at)
       VALUES (?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        submissionId,
        data.kind,
        data.opportunityId,
        data.channel,
        data.mailboxId || null,
        data.recipientEmail || null,
        JSON.stringify(splitEmails(data.cc)),
        data.subject || null,
        data.bodyHtml || null,
        data.fileMode || "separate",
        String(opportunity["submission_instructions"] || ""),
        messageId,
        context.user.id,
      ],
    );
    await db.execute(
      `UPDATE ${table} SET status = 'submitted', submitted_at = NOW(3) WHERE id = ?`,
      [data.opportunityId],
    );
    return { ok: true, submissionId };
  });

export const saveCurrency = createServerFn({ method: "POST" })
  .middleware([permissionMiddleware("settings.manage")])
  .validator(
    (data: {
      id?: string;
      code: string;
      name: string;
      symbol: string;
      isDefault?: boolean;
      isActive?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const db = await pool();
    const code = data.code.trim().toUpperCase();
    if (!/^[A-Z]{3,10}$/.test(code))
      throw new Error("Use a valid currency code such as MWK or USD.");
    if (data.isDefault) await db.execute("UPDATE currencies SET is_default = FALSE");
    await db.execute(
      `INSERT INTO currencies (id, code, name, symbol, is_default, is_active)
       VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), symbol = VALUES(symbol),
       is_default = VALUES(is_default), is_active = VALUES(is_active)`,
      [
        data.id || crypto.randomUUID(),
        code,
        data.name.trim(),
        data.symbol.trim(),
        Boolean(data.isDefault),
        data.isActive !== false,
      ],
    );
    return { ok: true };
  });

export const deleteCurrency = createServerFn({ method: "POST" })
  .middleware([permissionMiddleware("settings.manage")])
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = await pool();
    const selected = rows<{ is_default: number }>(
      await db.query("SELECT is_default FROM currencies WHERE id = ?", [data.id]),
    )[0];
    if (selected?.is_default)
      throw new Error("Choose another default currency before deleting this one.");
    await db.execute("DELETE FROM currencies WHERE id = ?", [data.id]);
    return { ok: true };
  });
