import { Prisma } from "@prisma/client";

export const logCampaignHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  campaignId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.campaignHistory.create({
    data: {
      userId,
      campaignId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

