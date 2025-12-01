import { Prisma } from "@prisma/client";

export const logCategoryHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  categoryId: string,
  action: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  // If you later add a CategoryHistory model, wire it up here similar to StoreHistory.
  // Placeholder for future auditing; currently a no-op to keep pattern consistent.
  return;
};


