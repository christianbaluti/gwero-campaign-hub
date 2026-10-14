import { createHash } from "node:crypto";
import { getPool } from "./db.server";
// Account and global limits do not trust caller-supplied proxy/IP headers.
export async function consumeLoginAttempt(email: string) {
  const windowId = Math.floor(Date.now() / 900000);
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    let allowed = true;
    for (const [scope, limit] of [
      ["global", 250],
      ["account:" + email.trim().toLowerCase(), 10],
    ] as const) {
      const key = createHash("sha256").update(scope).digest("hex");
      await connection.execute(
        "INSERT INTO security_login_limits (bucket, window_id, attempts) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE attempts = IF(window_id = VALUES(window_id), attempts + 1, 1), window_id = VALUES(window_id)",
        [key, windowId],
      );
      const [rows] = await connection.execute(
        "SELECT attempts FROM security_login_limits WHERE bucket = ?",
        [key],
      );
      const attempts = Number((rows as Array<{ attempts: number }>)[0]?.attempts);
      if (scope === "global" && attempts === 1)
        await connection.execute(
          "DELETE FROM security_login_limits WHERE window_id < ? LIMIT 1000",
          [windowId - 96],
        );
      if (attempts > limit) {
        allowed = false;
        break;
      }
    }
    await connection.commit();
    if (!allowed) throw new Error("Too many login attempts. Try again in 15 minutes.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
