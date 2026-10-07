import { createServerFn } from "@tanstack/react-start";
import { createDb, type DbInput, type DbResult } from "./db-query";
import { authMiddleware } from "./auth.middleware";

const dbAction = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: DbInput) => input)
  .handler(async ({ data, context }) => {
    const readOnly = data.action === "select";
    const permission = (() => {
      if (
        ["system_settings", "email_templates", "mailboxes", "mailbox_secrets"].includes(data.table)
      ) {
        return "settings.manage";
      }
      if (["roles", "permissions", "role_permissions"].includes(data.table)) return "users.manage";
      if (
        [
          "prospects",
          "prospect_categories",
          "prospect_contacts",
          "prospect_interactions",
          "ai_prospect_searches",
        ].includes(data.table)
      ) {
        return readOnly ? "prospects.view" : "prospects.manage";
      }
      if (["clients", "client_contacts"].includes(data.table)) return "clients.manage";
      if (
        [
          "campaigns",
          "campaign_recipients",
          "campaign_steps",
          "campaign_events",
          "email_suppressions",
          "replies",
        ].includes(data.table)
      )
        return "campaigns.manage";
      return null;
    })();
    if (permission && !context.user.permissions.includes(permission))
      throw new Error("Permission denied");
    const { runClientQuery } = await import("./db.server");
    return runClientQuery(data) as Promise<never>;
  });

export const db = createDb((input) => dbAction({ data: input }) as Promise<DbResult<unknown>>);
