import { Prisma } from "@prisma/client";

export const logExpenseHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  expenseId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.expenseHistory.create({
    data: {
      userId,
      expenseId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

