import { createServerFn } from "@tanstack/react-start";
import { authMiddleware, permissionMiddleware } from "./auth.middleware";

export const syncBidafOpportunities = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { runBidafOpportunitySync } = await import("./bidaf.server");
    return runBidafOpportunitySync();
  });

export const triggerBidafOpportunitySync = createServerFn({ method: "POST" })
  .middleware([permissionMiddleware("opportunities.manage")])
  .handler(async () => {
    const { runBidafOpportunitySync } = await import("./bidaf.server");
    return runBidafOpportunitySync(true);
  });
