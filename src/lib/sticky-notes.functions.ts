import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth.middleware";

const colours = new Set(["yellow", "pink", "blue", "green", "purple", "orange"]);

export type StickyNote = {
  id: string;
  page_key: string;
  title: string | null;
  body: string;
  color: string;
  is_pinned: boolean;
  is_open: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
  created_by: string;
  created_by_name: string;
  updated_at: string;
  mentions: Array<{ id: string; full_name: string; email: string }>;
  can_edit: boolean;
};

function pageKey(value: string) {
  const key = value.trim().split("?")[0] || "/";
  if (!key.startsWith("/") || key.startsWith("//") || key.length > 1000)
    throw new Error("Invalid page address.");
  return key;
}

function cleanInput(data: {
  pageKey: string;
  title?: string;
  body: string;
  color?: string;
  pinned?: boolean;
  mentionIds?: string[];
}) {
  const body = data.body.trim();
  if (!body) throw new Error("Write something on the note first.");
  if (body.length > 5000) throw new Error("A sticky note can contain up to 5,000 characters.");
  const color = colours.has(data.color || "") ? data.color! : "yellow";
  return {
    pageKey: pageKey(data.pageKey),
    title: data.title?.trim().slice(0, 255) || null,
    body,
    color,
    pinned: data.pinned !== false,
    mentionIds: [...new Set(data.mentionIds || [])].slice(0, 100),
  };
}

async function notifyMentions({
  noteId,
  mentionIds,
  actorId,
  actorName,
  page,
  title,
  body,
}: {
  noteId: string;
  mentionIds: string[];
  actorId: string;
  actorName: string;
  page: string;
  title: string | null;
  body: string;
}) {
  const { getPool } = await import("./db.server");
  const db = getPool();
  const actionUrl = `${page}${page.includes("?") ? "&" : "?"}note=${encodeURIComponent(noteId)}`;
  const notificationIds: string[] = [];
  for (const userId of mentionIds.filter((id) => id !== actorId)) {
    const notificationId = randomUUID();
    await db.execute(
      `INSERT INTO notifications
        (id, user_id, notification_type, title, body, action_url, entity_type, entity_id)
       SELECT ?, id, 'sticky_note.mention', ?, ?, ?, 'page_note', ?
         FROM system_users WHERE id = ? AND status = 'active'`,
      [
        notificationId,
        `${actorName} mentioned you in a sticky note`,
        `${title ? `${title}: ` : ""}${body}`.slice(0, 1000),
        actionUrl,
        noteId,
        userId,
      ],
    );
    notificationIds.push(notificationId);
  }
  if (!notificationIds.length) return { sent: 0, failed: 0 };
  const { sendPendingNotificationEmails } = await import("./notifications.server");
  return sendPendingNotificationEmails({ notificationIds, ignoreDelay: true });
}

export const getStickyNotes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: { pageKey: string }) => data)
  .handler(async ({ data, context }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    const [noteRows] = await db.execute(
      `SELECT n.*, u.full_name AS created_by_name
         FROM page_notes n JOIN system_users u ON u.id = n.created_by
        WHERE n.page_key = ? ORDER BY n.is_pinned DESC, n.updated_at DESC`,
      [pageKey(data.pageKey)],
    );
    const notes = JSON.parse(JSON.stringify(noteRows)) as Array<Record<string, unknown>>;
    const ids = notes.map((note) => String(note["id"]));
    let mentions: Array<{ note_id: string; id: string; full_name: string; email: string }> = [];
    if (ids.length) {
      const [mentionRows] = await db.execute(
        `SELECT m.note_id, u.id, u.full_name, u.email
           FROM page_note_mentions m JOIN system_users u ON u.id = m.user_id
          WHERE m.note_id IN (${ids.map(() => "?").join(",")}) ORDER BY u.full_name`,
        ids,
      );
      mentions = JSON.parse(JSON.stringify(mentionRows));
    }
    return notes.map((note) => ({
      ...note,
      is_pinned: Boolean(note["is_pinned"]),
      is_open: Boolean(note["is_open"]),
      mentions: mentions.filter((mention) => mention.note_id === note["id"]),
      can_edit:
        note["created_by"] === context.user.id || context.user.permissions.includes("users.manage"),
    })) as unknown as StickyNote[];
  });

export const getStickyNoteUsers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { getPool } = await import("./db.server");
    const [rows] = await getPool().execute(
      "SELECT id, full_name, email FROM system_users WHERE status = 'active' ORDER BY full_name",
    );
    return JSON.parse(JSON.stringify(rows)) as Array<{
      id: string;
      full_name: string;
      email: string;
    }>;
  });

export const createStickyNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      pageKey: string;
      title?: string;
      body: string;
      color?: string;
      pinned?: boolean;
      mentionIds?: string[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const input = cleanInput(data);
    const { getPool } = await import("./db.server");
    const db = getPool();
    const id = randomUUID();
    const [positionRows] = await db.execute(
      `SELECT COUNT(*) AS note_count, COALESCE(MAX(z_index), 0) AS max_z
         FROM page_notes WHERE page_key = ?`,
      [input.pageKey],
    );
    const placement = (positionRows as Array<{ note_count: number; max_z: number }>)[0];
    const offset = Number(placement?.note_count || 0) % 6;
    await db.execute(
      `INSERT INTO page_notes
        (id, page_key, title, body, color, is_pinned, is_open, position_x, position_y, width, height,
         z_index, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?, 280, 260, ?, ?, ?)`,
      [
        id,
        input.pageKey,
        input.title,
        input.body,
        input.color,
        input.pinned ? 1 : 0,
        300 + offset * 28,
        112 + offset * 28,
        Number(placement?.max_z || 0) + 1,
        context.user.id,
        context.user.id,
      ],
    );
    for (const userId of input.mentionIds)
      await db.execute("INSERT IGNORE INTO page_note_mentions (note_id, user_id) VALUES (?, ?)", [
        id,
        userId,
      ]);
    const email = await notifyMentions({
      noteId: id,
      mentionIds: input.mentionIds,
      actorId: context.user.id,
      actorName: context.user.fullName,
      page: input.pageKey,
      title: input.title,
      body: input.body,
    });
    return { id, email };
  });

export const updateStickyNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      noteId: string;
      pageKey: string;
      title?: string;
      body: string;
      color?: string;
      pinned?: boolean;
      mentionIds?: string[];
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const input = cleanInput(data);
    const { getPool } = await import("./db.server");
    const db = getPool();
    const [rows] = await db.execute("SELECT created_by FROM page_notes WHERE id = ? LIMIT 1", [
      data.noteId,
    ]);
    const note = (rows as Array<{ created_by: string }>)[0];
    if (!note) throw new Error("Sticky note not found.");
    if (note.created_by !== context.user.id && !context.user.permissions.includes("users.manage"))
      throw new Error("Only the note author or an administrator can edit this note.");
    const [oldRows] = await db.execute("SELECT user_id FROM page_note_mentions WHERE note_id = ?", [
      data.noteId,
    ]);
    const oldIds = new Set((oldRows as Array<{ user_id: string }>).map((row) => row.user_id));
    await db.execute(
      `UPDATE page_notes SET page_key = ?, title = ?, body = ?, color = ?, is_pinned = ?, updated_by = ?
        WHERE id = ?`,
      [
        input.pageKey,
        input.title,
        input.body,
        input.color,
        input.pinned ? 1 : 0,
        context.user.id,
        data.noteId,
      ],
    );
    await db.execute("DELETE FROM page_note_mentions WHERE note_id = ?", [data.noteId]);
    for (const userId of input.mentionIds)
      await db.execute("INSERT INTO page_note_mentions (note_id, user_id) VALUES (?, ?)", [
        data.noteId,
        userId,
      ]);
    const email = await notifyMentions({
      noteId: data.noteId,
      mentionIds: input.mentionIds.filter((id) => !oldIds.has(id)),
      actorId: context.user.id,
      actorName: context.user.fullName,
      page: input.pageKey,
      title: input.title,
      body: input.body,
    });
    return { ok: true, email };
  });

function wholeNumber(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.round(value!)));
}

export const updateStickyNoteLayout = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (data: {
      noteId: string;
      positionX?: number;
      positionY?: number;
      width?: number;
      height?: number;
      zIndex?: number;
      isOpen?: boolean;
      isPinned?: boolean;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    const [rows] = await db.execute(
      `SELECT position_x, position_y, width, height, z_index, is_open, is_pinned
         FROM page_notes WHERE id = ? LIMIT 1`,
      [data.noteId],
    );
    const note = (
      rows as Array<{
        position_x: number;
        position_y: number;
        width: number;
        height: number;
        z_index: number;
        is_open: number;
        is_pinned: number;
      }>
    )[0];
    if (!note) throw new Error("Sticky note not found.");
    await db.execute(
      `UPDATE page_notes
          SET position_x = ?, position_y = ?, width = ?, height = ?, z_index = ?,
              is_open = ?, is_pinned = ?, updated_by = ?
        WHERE id = ?`,
      [
        wholeNumber(data.positionX, note.position_x, 0, 10000),
        wholeNumber(data.positionY, note.position_y, 80, 10000),
        wholeNumber(data.width, note.width, 210, 900),
        wholeNumber(data.height, note.height, 180, 900),
        wholeNumber(data.zIndex, note.z_index, 1, 1000000),
        data.isOpen === undefined ? note.is_open : data.isOpen ? 1 : 0,
        data.isPinned === undefined ? note.is_pinned : data.isPinned ? 1 : 0,
        context.user.id,
        data.noteId,
      ],
    );
    return { ok: true };
  });

export const deleteStickyNote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { noteId: string }) => data)
  .handler(async ({ data, context }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    const [rows] = await db.execute("SELECT created_by FROM page_notes WHERE id = ? LIMIT 1", [
      data.noteId,
    ]);
    const note = (rows as Array<{ created_by: string }>)[0];
    if (!note) return { ok: true };
    if (note.created_by !== context.user.id && !context.user.permissions.includes("users.manage"))
      throw new Error("Only the note author or an administrator can delete this note.");
    await db.execute("DELETE FROM page_notes WHERE id = ?", [data.noteId]);
    return { ok: true };
  });
