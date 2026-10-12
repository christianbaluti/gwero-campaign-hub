import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/attachments/upload")({ server: { handlers: {
  POST: async ({ request }) => {
    const { currentUser } = await import("@/lib/auth.server");
    if (!(await currentUser())) return Response.json({ error: "Authentication required" }, { status: 401 });
    const origin = request.headers.get("origin");
    const expected = new URL(process.env["APP_URL"] || request.url).origin;
    if (origin !== expected || request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Origin rejected" }, { status: 403 });
    const limit = 21 * 1024 * 1024;
    if (Number(request.headers.get("content-length") || 0) > limit) return Response.json({ error: "File too large" }, { status: 413 });
    try {
      const chunks: Uint8Array[] = []; let size = 0;
      const reader = request.body?.getReader();
      if (!reader) return Response.json({ error: "Missing file" }, { status: 400 });
      while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); return Response.json({ error: "File too large" }, { status: 413 }); } chunks.push(value); }
      const body = Buffer.concat(chunks);
      const form = await new Response(body, { headers: { "content-type": request.headers.get("content-type") || "" } }).formData();
      const ownerId = form.get("ownerId") || form.get("campaignId"); const file = form.get("file");
      if (typeof ownerId !== "string" || !(file instanceof File)) return Response.json({ error: "Missing owner or file" }, { status: 400 });
      const { requireAttachmentAccess } = await import("@/lib/attachment-access.server");
      const user = await requireAttachmentAccess(ownerId, true);
      const { saveAttachment } = await import("@/lib/attachments.server");
      return Response.json(await saveAttachment(ownerId, file, user.id));
    } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 }); }
  }
} } });
