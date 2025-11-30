import prisma from "../../utils/db.js";

export const logStoreHistory = async (
  doerMemberId: string,
  storeId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await prisma.storeHistory.create({
    data: {
      doerMemberId: doerMemberId,
      storeId: storeId,
      action: action,
      reason: reason,
      ipAddress: ipAddress,
      userAgent: userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};
