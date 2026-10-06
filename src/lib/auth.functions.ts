import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import {
  currentUser,
  hashPassword,
  issueSession,
  revokeCurrentSession,
  verifyPassword,
} from "./auth.server";
import { permissionMiddleware } from "./auth.middleware";

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit() {
  const key = getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const item = attempts.get(key);
  if (!item || item.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return;
  }
  if (item.count >= 10) throw new Error("Too many login attempts. Try again in 15 minutes.");
  item.count += 1;
}

export const getAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getPool } = await import("./db.server");
  const [rows] = await getPool().query(
    "SELECT COUNT(*) AS total FROM system_users WHERE password_hash IS NOT NULL",
  );
  return {
    user: await currentUser(),
    bootstrapRequired: Number((rows as Array<{ total: number }>)[0]?.total || 0) === 0,
  };
});

export const login = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    checkRateLimit();
    const { getPool } = await import("./db.server");
    const [rows] = await getPool().execute(
      "SELECT id, password_hash, status FROM system_users WHERE email = ? LIMIT 1",
      [data.email.trim().toLowerCase()],
    );
    const user = (rows as Array<{ id: string; password_hash: string | null; status: string }>)[0];
    const valid = await verifyPassword(user?.password_hash, data.password);
    if (!user || !valid || user.status !== "active") throw new Error("Invalid email or password.");
    await issueSession(user.id);
    await getPool().execute(
      "UPDATE system_users SET last_login_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
      [user.id],
    );
    return { ok: true };
  });

export const bootstrapAdministrator = createServerFn({ method: "POST" })
  .validator((data: { fullName: string; email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    const [counts] = await db.query(
      "SELECT COUNT(*) AS total FROM system_users WHERE password_hash IS NOT NULL",
    );
    if (Number((counts as Array<{ total: number }>)[0]?.total || 0) > 0)
      throw new Error("Administrator setup has already been completed.");
    const [roles] = await db.execute("SELECT id FROM roles WHERE name = 'Administrator' LIMIT 1");
    const roleId = (roles as Array<{ id: string }>)[0]?.id;
    if (!roleId) throw new Error("Administrator role is unavailable. Run the database migration.");
    const { randomUUID } = await import("node:crypto");
    const id = randomUUID();
    await db.execute(
      `INSERT INTO system_users (id, full_name, email, role_id, status, password_hash)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [
        id,
        data.fullName.trim(),
        data.email.trim().toLowerCase(),
        roleId,
        await hashPassword(data.password),
      ],
    );
    await issueSession(id);
    return { ok: true };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  await revokeCurrentSession();
  return { ok: true };
});

export const saveSystemUser = createServerFn({ method: "POST" })
  .middleware([permissionMiddleware("users.manage")])
  .validator(
    (data: {
      id?: string;
      fullName: string;
      email: string;
      roleId: string | null;
      status: string;
      password?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    const values: Array<string | null> = [
      data.fullName.trim(),
      data.email.trim().toLowerCase(),
      data.roleId,
      data.status,
    ];
    const passwordSql = data.password ? ", password_hash = ?" : "";
    if (data.password) values.push(await hashPassword(data.password));
    if (data.id) {
      if (data.id === context.user.id && data.status !== "active")
        throw new Error("You cannot suspend your own account.");
      if (data.id === context.user.id && data.roleId !== context.user.roleId)
        throw new Error("You cannot change your own role while signed in.");
      values.push(data.id);
      await db.execute(
        `UPDATE system_users SET full_name = ?, email = ?, role_id = ?, status = ?${passwordSql} WHERE id = ?`,
        values,
      );
    } else {
      if (!data.password) throw new Error("Set an initial password for the new user.");
      const { randomUUID } = await import("node:crypto");
      await db.execute(
        "INSERT INTO system_users (id, full_name, email, role_id, status, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
        [
          randomUUID(),
          data.fullName.trim(),
          data.email.trim().toLowerCase(),
          data.roleId,
          data.status,
          await hashPassword(data.password),
        ],
      );
    }
    return { ok: true };
  });

export const deleteSystemUser = createServerFn({ method: "POST" })
  .middleware([permissionMiddleware("users.manage")])
  .validator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    if (data.id === context.user.id) throw new Error("You cannot delete your own account.");
    const { getPool } = await import("./db.server");
    await getPool().execute("DELETE FROM system_users WHERE id = ?", [data.id]);
    return { ok: true };
  });

export const createRole = createServerFn({ method: "POST" })
  .middleware([permissionMiddleware("users.manage")])
  .validator((data: { name: string; description: string }) => data)
  .handler(async ({ data }) => {
    const { randomUUID } = await import("node:crypto");
    const { getPool } = await import("./db.server");
    await getPool().execute(
      "INSERT INTO roles (id, name, description, is_system) VALUES (?, ?, ?, FALSE)",
      [randomUUID(), data.name.trim(), data.description.trim() || null],
    );
    return { ok: true };
  });

export const setRolePermission = createServerFn({ method: "POST" })
  .middleware([permissionMiddleware("users.manage")])
  .validator((data: { roleId: string; permissionId: string; enabled: boolean }) => data)
  .handler(async ({ data }) => {
    const { getPool } = await import("./db.server");
    const db = getPool();
    if (data.enabled) {
      const { randomUUID } = await import("node:crypto");
      await db.execute(
        "INSERT IGNORE INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)",
        [randomUUID(), data.roleId, data.permissionId],
      );
    } else {
      await db.execute("DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?", [
        data.roleId,
        data.permissionId,
      ]);
    }
    return { ok: true };
  });
