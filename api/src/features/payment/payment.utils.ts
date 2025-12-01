import { Prisma } from "@prisma/client";

export const logPaymentHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  paymentId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.paymentHistory.create({
    data: {
      userId,
      paymentId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

