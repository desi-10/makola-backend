import { Prisma } from "@prisma/client";
import crypto from "crypto";

export const generateInviteToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const logInviteHistory = async (
  tx: Prisma.TransactionClient,
  userId: string,
  inviteId: string,
  action: string,
  status: string | null,
  reason: string,
  ipAddress: string,
  userAgent: string,
  meta?: Record<string, any>
) => {
  await tx.inviteHistory.create({
    data: {
      userId,
      inviteId,
      action,
      status: status as any,
      reason: reason || "",
      ipAddress,
      userAgent,
      meta: meta ? JSON.stringify(meta) : undefined,
    },
  });
};

