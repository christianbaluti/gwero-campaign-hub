import { randomUUID } from "node:crypto";
import { getPool } from "./db.server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveAttachment(campaignId: string, file: File) {
  if (!uuid.test(campaignId)) throw new Error("Invalid campaign ID");
  if (file.size > 20 * 1024 * 1024) throw new Error("Attachment exceeds 20 MB");
  const fileId = randomUUID();
  const path = `${campaignId}/${fileId}`;
  await getPool().execute(
    `INSERT INTO attachment_files (id, owner_id, file_name, content_type, file_size, content)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      fileId,
      campaignId,
      file.name,
      file.type || "application/octet-stream",
      file.size,
      Buffer.from(await file.arrayBuffer()),
    ],
  );
  return { path, name: file.name, type: file.type || "application/octet-stream", size: file.size };
}

export async function saveAttachmentBuffer(
  ownerId: string,
  content: Uint8Array,
  name: string,
  type = "application/octet-stream",
) {
  if (!uuid.test(ownerId)) throw new Error("Invalid attachment owner ID");
  if (content.byteLength > 20 * 1024 * 1024) throw new Error("Attachment exceeds 20 MB");
  const fileId = randomUUID();
  const path = `${ownerId}/${fileId}`;
  await getPool().execute(
    `INSERT INTO attachment_files (id, owner_id, file_name, content_type, file_size, content)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [fileId, ownerId, name, type, content.byteLength, Buffer.from(content)],
  );
  return { path, name, type, size: content.byteLength };
}

export async function readAttachment(path: string) {
  return (await readAttachmentRecord(path)).content;
}

export async function readAttachmentRecord(path: string) {
  const parts = path.split("/");
  if (parts.length !== 2 || !parts.every((part) => uuid.test(part)))
    throw new Error("Invalid attachment path");
  const [rows] = await getPool().execute(
    `SELECT content, file_name, content_type, file_size
       FROM attachment_files WHERE owner_id = ? AND id = ? LIMIT 1`,
    parts,
  );
  const row = (
    rows as Array<{
      content: Buffer;
      file_name: string;
      content_type: string;
      file_size: number;
    }>
  )[0];
  if (!row) throw new Error("Attachment not found");
  return {
    content: row.content,
    name: row.file_name,
    type: row.content_type || "application/octet-stream",
    size: row.file_size,
  };
}
