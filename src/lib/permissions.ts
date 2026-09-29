export const PERMISSIONS = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "categories.view",
  "categories.create",
  "categories.edit",
  "categories.delete",
  "orders.view",
  "orders.update",
  "customers.view",
  "videos.manage",
  "branding.manage",
  "settings.manage",
  "payments.view",
  "coupons.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function hasPermission(
  userPermissions: string[],
  required: Permission | Permission[],
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true;
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((p) => userPermissions.includes(p));
}
