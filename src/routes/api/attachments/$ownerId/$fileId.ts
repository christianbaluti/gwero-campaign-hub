import { attachmentHeaders } from "@/lib/attachment-policy";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/attachments/$ownerId/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { currentUser } = await import("@/lib/auth.server");
        if (!(await currentUser())) return new Response("Authentication required", { status: 401 });
        try {
          const { requireAttachmentAccess } = await import("@/lib/attachment-access.server");
          await requireAttachmentAccess(params.ownerId);
          const { readAttachmentRecord } = await import("@/lib/attachments.server");
          const attachment = await readAttachmentRecord(`${params.ownerId}/${params.fileId}`);
          const body = attachment.content.buffer.slice(
            attachment.content.byteOffset,
            attachment.content.byteOffset + attachment.content.byteLength,
          ) as ArrayBuffer;
          return new Response(body, { headers: attachmentHeaders(attachment.name, attachment.size) });
        } catch {
          return new Response("Attachment not found", { status: 404 });
        }
      },
    },
  },
});
