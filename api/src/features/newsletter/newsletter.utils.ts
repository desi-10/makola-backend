import { Prisma } from "@prisma/client";

export const logNewsletterHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  newsletterId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.newsletterHistory.create({
    data: {
      userId,
      newsletterId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

