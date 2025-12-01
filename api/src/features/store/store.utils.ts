import { Prisma } from "@prisma/client";

export const logStoreHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  storeId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.storeHistory.create({
    data: {
      userId,
      storeId,
      action,
      reason,
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};
