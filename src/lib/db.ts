import { createServerFn } from "@tanstack/react-start";
import { createDb, type DbInput } from "./db-query";

const dbAction = createServerFn({ method: "POST" })
  .validator((input: DbInput) => input)
  .handler(async ({ data }) => {
    const { runClientQuery } = await import("./db.server");
    return runClientQuery(data) as Promise<any>;
  });

export const db = createDb((input) => dbAction({ data: input }) as Promise<any>);
