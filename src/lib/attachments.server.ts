import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const root = resolve(process.env["ATTACHMENT_DIR"] || "var/attachments");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveAttachment(campaignId: string, file: File) {
  if (!uuid.test(campaignId)) throw new Error("Invalid campaign ID");
  if (file.size > 20 * 1024 * 1024) throw new Error("Attachment exceeds 20 MB");
  const directory = join(root, campaignId);
  await mkdir(directory, { recursive: true });
  const path = `${campaignId}/${randomUUID()}`;
  await writeFile(join(root, path), Buffer.from(await file.arrayBuffer()), {
    flag: "wx",
    mode: 0o600,
  });
  return { path, name: file.name, type: file.type || "application/octet-stream", size: file.size };
}

export async function readAttachment(path: string) {
  const parts = path.split("/");
  if (parts.length !== 2 || !parts.every((part) => uuid.test(part)))
    throw new Error("Invalid attachment path");
  return readFile(join(root, ...parts));
}
