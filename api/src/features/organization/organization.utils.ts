import prisma from "../../utils/db.js";

export const logOrganizationHistory = async (
  doerUserId: string,
  organizationId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await prisma.organizationHistory.create({
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
