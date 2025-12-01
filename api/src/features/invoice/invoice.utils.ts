import { Prisma } from "@prisma/client";

export const logInvoiceHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  invoiceId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.invoiceHistory.create({
    data: {
      userId,
      invoiceId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

