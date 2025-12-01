import { Prisma } from "@prisma/client";

export const logOrderHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  orderId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.orderHistory.create({
    data: {
      userId,
      orderId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

