export type EmailAttachment = {
  path: string;
  name: string;
  type: string;
  size: number;
};

export function parseEmailAttachments(value: unknown): EmailAttachment[] {
  if (Array.isArray(value)) return value as EmailAttachment[];
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as EmailAttachment[]) : [];
  } catch {
    return [];
  }
}

export function emailAttachmentUrl(path: string) {
  const [ownerId, fileId] = path.split("/");
  return `/api/attachments/${encodeURIComponent(ownerId || "")}/${encodeURIComponent(fileId || "")}`;
}
