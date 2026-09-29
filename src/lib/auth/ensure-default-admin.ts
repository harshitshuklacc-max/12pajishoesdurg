import { db } from "@/db";
import { admins, adminRoles, permissions, adminRolePermissions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "./admin-auth";
import { PERMISSIONS } from "@/lib/permissions";

export const DEFAULT_ADMIN_USERNAME = "WPaJiShoes";
export const DEFAULT_ADMIN_PASSWORD = "WPPaJJoi@12356789";

async function ensureSuperAdminRole(): Promise<number | null> {
  for (const key of PERMISSIONS) {
    await db.insert(permissions).values({ key, description: key }).onConflictDoNothing();
  }

  const [role] = await db
    .insert(adminRoles)
    .values({ name: "Super Admin", description: "Full access", isSuperAdmin: true })
    .onConflictDoNothing()
    .returning();

  let roleId: number | null = role?.id ?? null;
  if (!roleId) {
    const existing = await db.query.adminRoles.findFirst({ where: eq(adminRoles.name, "Super Admin") });
    roleId = existing?.id ?? null;
  }

  if (roleId) {
    const allPerms = await db.select().from(permissions);
    for (const p of allPerms) {
      await db
        .insert(adminRolePermissions)
        .values({ roleId, permissionId: p.id })
        .onConflictDoNothing();
    }
  }

  return roleId;
}

/** Creates default admin if missing. Optionally syncs password (seed / explicit reset). */
export async function ensureDefaultAdmin(options?: { syncPassword?: boolean }): Promise<void> {
  const roleId = await ensureSuperAdminRole();
  const passwordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);

  const existing = await db.query.admins.findFirst({
    where: sql`lower(${admins.username}) = lower(${DEFAULT_ADMIN_USERNAME})`,
  });

  if (!existing) {
    await db.insert(admins).values({
      username: DEFAULT_ADMIN_USERNAME,
      email: "admin@pajishoes.local",
      passwordHash,
      name: "Paji Shoes Admin",
      roleId,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    return;
  }

  if (options?.syncPassword) {
    await db
      .update(admins)
      .set({
        passwordHash,
        roleId,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, existing.id));
  }
}
