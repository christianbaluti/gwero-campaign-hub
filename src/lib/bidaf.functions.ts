import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth.middleware";

export const syncBidafOpportunities = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { runBidafOpportunitySync } = await import("./bidaf.server");
    return runBidafOpportunitySync();
  });
