import { Prisma } from "@prisma/client";

export const logProductHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  productId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.productHistory.create({
    data: {
      userId,
      productId,
      action,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};
