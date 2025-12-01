import { Prisma } from "@prisma/client";

export const logDiscountHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  discountId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.discountHistory.create({
    data: {
      userId,
      discountId,
      action,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

