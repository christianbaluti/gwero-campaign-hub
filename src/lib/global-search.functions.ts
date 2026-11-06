import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./auth.middleware";

export const searchEverywhere = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((data: { query: string }) => ({ query: String(data?.query || "").slice(0, 120) }))
  .handler(async ({ data, context }) => {
    const { searchEverywhereServer } = await import("./global-search.server");
    return searchEverywhereServer(data.query, context.user);
  });
