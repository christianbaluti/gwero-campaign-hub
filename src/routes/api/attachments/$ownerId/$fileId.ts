import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/attachments/$ownerId/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { currentUser } = await import("@/lib/auth.server");
        if (!(await currentUser())) return new Response("Authentication required", { status: 401 });
        try {
          const { readAttachmentRecord } = await import("@/lib/attachments.server");
          const attachment = await readAttachmentRecord(`${params.ownerId}/${params.fileId}`);
          const body = attachment.content.buffer.slice(
            attachment.content.byteOffset,
            attachment.content.byteOffset + attachment.content.byteLength,
          ) as ArrayBuffer;
          const inline =
            attachment.type.startsWith("image/") || attachment.type === "application/pdf";
          const safeName = attachment.name.replace(/["\\\r\n]/g, "_");
          return new Response(body, {
            headers: {
              "content-type": attachment.type,
              "content-length": String(attachment.size),
              "content-disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
              "x-content-type-options": "nosniff",
              "cache-control": "private, max-age=3600",
            },
          });
        } catch {
          return new Response("Attachment not found", { status: 404 });
        }
      },
    },
  },
});
