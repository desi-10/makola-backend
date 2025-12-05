import { Prisma } from "@prisma/client";

export const logOrganizationHistory = async (
  tx: Prisma.TransactionClient,
  doerUserId: string,
  organizationId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.organizationHistory.create({
    data: {
      doerUserId,
      organizationId,
      action: action,
      reason: reason,
      ipAddress: ipAddress,
      userAgent: userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};
