export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export function validateAttachmentBytes(name: string, bytes: Uint8Array): string {
  if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES) throw new Error("Choose a file up to 20 MB");
  const ext = name.split(".").pop()?.toLowerCase();
  const starts = (signature: number[]) => signature.every((v, i) => bytes[i] === v);
  const allowed: Record<string, [string, boolean]> = {
    pdf: ["application/pdf", starts([37,80,68,70,45])],
    png: ["image/png", starts([137,80,78,71,13,10,26,10])],
    jpg: ["image/jpeg", starts([255,216,255])], jpeg: ["image/jpeg", starts([255,216,255])],
    gif: ["image/gif", starts([71,73,70,56])],
    webp: ["image/webp", starts([82,73,70,70]) && String.fromCharCode(...bytes.slice(8,12)) === "WEBP"],
    docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", starts([80,75,3,4])],
    xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", starts([80,75,3,4])],
    pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation", starts([80,75,3,4])],
    doc: ["application/msword", starts([208,207,17,224,161,177,26,225])],
    xls: ["application/vnd.ms-excel", starts([208,207,17,224,161,177,26,225])],
    csv: ["text/csv", !bytes.includes(0)], txt: ["text/plain", !bytes.includes(0)],
  };
  const match = ext && Object.hasOwn(allowed, ext) ? allowed[ext] : undefined;
  if (!match || !match[1]) throw new Error("Choose a valid PDF, Office document, CSV, text or raster image. Active files such as SVG and HTML are not accepted.");
  return match[0];
}
export function attachmentHeaders(name: string, size: number) {
  const safeName = name.replace(/[\x00-\x1f\x7f"\\]/g, "_").replace(/[^\x20-\x7e]/g, "_");
  return { "content-type": "application/octet-stream", "content-length": String(size),
    "content-disposition": `attachment; filename="${safeName || "download"}"`,
    "x-content-type-options": "nosniff", "content-security-policy": "sandbox; default-src 'none'; frame-ancestors 'none'",
    "cache-control": "private, no-store" };
}
