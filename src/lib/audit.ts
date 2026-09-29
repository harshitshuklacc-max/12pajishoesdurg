import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(params: {
  adminId: number;
  action: string;
  entityType: string;
  entityId?: string | number;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await db.insert(auditLogs).values({
    adminId: params.adminId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId?.toString(),
    metadata: params.metadata,
    ipAddress: params.ipAddress,
  });
}
