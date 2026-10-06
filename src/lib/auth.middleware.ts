import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { requireUser } = await import("./auth.server");
  const user = await requireUser();
  return next({ context: { user } });
});

export function permissionMiddleware(permission: string) {
  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    const { requireUser } = await import("./auth.server");
    const user = await requireUser(permission);
    return next({ context: { user } });
  });
}
