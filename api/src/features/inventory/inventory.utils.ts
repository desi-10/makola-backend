import { Prisma } from "@prisma/client";

export const logInventoryHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  inventoryId: string,
  action: string,
  quantity: number,
  previousQuantity: number,
  newQuantity: number,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.inventoryHistory.create({
    data: {
      userId,
      inventoryId,
      action,
      quantity,
      previousQuantity,
      newQuantity,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

