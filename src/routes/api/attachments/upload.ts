import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/attachments/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const campaignId = form.get("campaignId");
        const file = form.get("file");
        if (typeof campaignId !== "string" || !(file instanceof File))
          return Response.json({ error: "Missing campaign or file" }, { status: 400 });
        try {
          const { saveAttachment } = await import("@/lib/attachments.server");
          return Response.json(await saveAttachment(campaignId, file));
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
