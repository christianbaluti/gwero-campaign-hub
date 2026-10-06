import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/attachments/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { currentUser } = await import("@/lib/auth.server");
        if (!(await currentUser()))
          return Response.json({ error: "Authentication required" }, { status: 401 });
        const form = await request.formData();
        const ownerId = form.get("ownerId") || form.get("campaignId");
        const file = form.get("file");
        if (typeof ownerId !== "string" || !(file instanceof File))
          return Response.json({ error: "Missing owner or file" }, { status: 400 });
        try {
          const { saveAttachment } = await import("@/lib/attachments.server");
          return Response.json(await saveAttachment(ownerId, file));
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 400 },
          );
        }
      },
    },
  },
});
