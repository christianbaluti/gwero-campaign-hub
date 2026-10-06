import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/attachments/$ownerId/$fileId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { currentUser } = await import("@/lib/auth.server");
        if (!(await currentUser())) return new Response("Authentication required", { status: 401 });
        try {
          const { readAttachment } = await import("@/lib/attachments.server");
          const content = await readAttachment(`${params.ownerId}/${params.fileId}`);
          const body = content.buffer.slice(
            content.byteOffset,
            content.byteOffset + content.byteLength,
          ) as ArrayBuffer;
          return new Response(body, {
            headers: {
              "content-type": "application/octet-stream",
              "content-disposition": `attachment; filename="${params.fileId}"`,
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
