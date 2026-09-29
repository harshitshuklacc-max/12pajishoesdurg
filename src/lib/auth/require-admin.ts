import { getAdminSession } from "./session";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requireAdmin(permission?: Permission) {
  const session = await getAdminSession();
  if (!session) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }
  if (permission && !hasPermission(session.permissions, permission, session.isSuperAdmin)) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }
  return { error: null, status: 200 as const, session };
}
