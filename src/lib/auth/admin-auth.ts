import bcrypt from "bcryptjs";
import { db } from "@/db";
import { admins, adminRoles, adminRolePermissions, permissions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureDefaultAdmin } from "./ensure-default-admin";
import { setAdminSession, clearAdminSession, type AdminSession } from "./session";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function loginAdmin(username: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureDefaultAdmin({ syncPassword: process.env.SYNC_DEFAULT_ADMIN === "true" });

  const normalized = username.trim();
  const admin = await db.query.admins.findFirst({
    where: sql`lower(${admins.username}) = lower(${normalized})`,
  });
  if (!admin || !admin.isActive) {
    return { ok: false, error: "Invalid username or password" };
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    return { ok: false, error: "Account temporarily locked. Try again later." };
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    const attempts = admin.failedLoginAttempts + 1;
    const updates: Partial<typeof admins.$inferInsert> = {
      failedLoginAttempts: attempts,
      updatedAt: new Date(),
    };
    if (attempts >= MAX_ATTEMPTS) {
      updates.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      updates.failedLoginAttempts = 0;
    }
    await db.update(admins).set(updates).where(eq(admins.id, admin.id));
    return { ok: false, error: "Invalid username or password" };
  }

  const session = await buildAdminSession(admin.id, admin.username, admin.email ?? admin.username, admin.name, admin.roleId);
  await db
    .update(admins)
    .set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(admins.id, admin.id));

  await setAdminSession(session);
  return { ok: true };
}

export async function buildAdminSession(
  adminId: number,
  username: string,
  email: string,
  name: string,
  roleId: number | null
): Promise<AdminSession> {
  let isSuperAdmin = false;
  let permKeys: string[] = [];

  if (roleId) {
    const role = await db.query.adminRoles.findFirst({ where: eq(adminRoles.id, roleId) });
    isSuperAdmin = role?.isSuperAdmin ?? false;
    if (!isSuperAdmin) {
      const rows = await db
        .select({ key: permissions.key })
        .from(adminRolePermissions)
        .innerJoin(permissions, eq(adminRolePermissions.permissionId, permissions.id))
        .where(eq(adminRolePermissions.roleId, roleId));
      permKeys = rows.map((r) => r.key);
    }
  }

  return { adminId, username, email, name, roleId, isSuperAdmin, permissions: permKeys };
}

export async function logoutAdmin() {
  await clearAdminSession();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
