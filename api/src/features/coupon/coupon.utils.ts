import { Prisma } from "@prisma/client";

export const logCouponHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  couponId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.couponHistory.create({
    data: {
      userId,
      couponId,
      action,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

