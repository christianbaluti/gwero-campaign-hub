import { requireUser } from "./auth.server";
import { getPool } from "./db.server";
export async function requireAttachmentAccess(ownerId: string, allowNew = false) {
  if (!/^[0-9a-f-]{36}$/i.test(ownerId)) throw new Error("Invalid attachment owner");
  const user = await requireUser();
  const [rows] = await getPool().execute(
    "SELECT 'campaigns.manage' AS permission FROM campaigns WHERE id = ? UNION ALL SELECT 'prospects.manage' FROM prospect_contacts WHERE id = ? UNION ALL SELECT 'opportunities.manage' FROM bids WHERE id = ? UNION ALL SELECT 'opportunities.manage' FROM requests WHERE id = ?",
    [ownerId, ownerId, ownerId, ownerId],
  );
  const permissions = (rows as Array<{ permission: string }>).map((row) => row.permission);
  if (
    permissions.length &&
    permissions.every((permission) => user.permissions.includes(permission))
  )
    return user;
  if (!permissions.length) {
    const [existing] = await getPool().execute(
      "SELECT uploaded_by FROM attachment_files WHERE owner_id = ? LIMIT 1",
      [ownerId],
    );
    const owner = (existing as Array<{ uploaded_by: string | null }>)[0];
    if (owner && owner.uploaded_by === user.id) return user;
    if (user.roleName === "Administrator") return user;
    if (
      allowNew &&
      !owner &&
      ["campaigns.manage", "prospects.manage", "opportunities.manage"].some((permission) =>
        user.permissions.includes(permission),
      )
    )
      return user;
  }
  throw new Error("Permission denied");
}
