import { Prisma } from "@prisma/client";

export const logFlashSaleHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  flashSaleId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.flashSaleHistory.create({
    data: {
      userId,
      flashSaleId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

