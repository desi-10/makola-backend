import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateInviteSchemaType } from "./invite.validators.js";
import { logInviteHistory, generateInviteToken } from "./invite.utils.js";

export const getInvitesService = async (storeId: string | null, organizationId: string | null) => {
  const where: any = { isActive: true };
  if (storeId) where.storeId = storeId;
  if (organizationId) where.organizationId = organizationId;

  const invites = await prisma.invite.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Invites fetched successfully", invites);
};

export const getInviteService = async (inviteId: string) => {
  const invite = await prisma.invite.findFirst({
    where: { id: inviteId, isActive: true },
  });

  if (!invite) {
    throw new ApiError("Invite not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Invite fetched successfully", invite);
};

export const getInviteByTokenService = async (token: string) => {
  const invite = await prisma.invite.findUnique({
    where: { token },
  });

  if (!invite) {
    throw new ApiError("Invalid invite token", StatusCodes.NOT_FOUND);
  }

  if (invite.status !== "PENDING") {
    throw new ApiError("Invite already used or expired", StatusCodes.BAD_REQUEST);
  }

  if (invite.expiresAt < new Date()) {
    throw new ApiError("Invite has expired", StatusCodes.BAD_REQUEST);
  }

  return apiResponse("Invite fetched successfully", invite);
};

export const createInviteService = async (
  userId: string,
  storeId: string | null,
  organizationId: string | null,
  data: CreateInviteSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  if (!storeId && !organizationId) {
    throw new ApiError("Either storeId or organizationId is required", StatusCodes.BAD_REQUEST);
  }

  const existingInvite = await prisma.invite.findFirst({
    where: {
      email: data.email,
      storeId: storeId || undefined,
      organizationId: organizationId || undefined,
      status: "PENDING",
      expiresAt: { gte: new Date() },
    },
  });

  if (existingInvite) {
    throw new ApiError("Active invite already exists for this email", StatusCodes.CONFLICT);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7));

  const result = await prisma.$transaction(async (tx) => {
    const invite = await tx.invite.create({
      data: {
        email: data.email,
        storeId: storeId || undefined,
        organizationId: organizationId || undefined,
        roleId: data.roleId,
        token: generateInviteToken(),
        status: "PENDING",
        invitedBy: userId,
        expiresAt,
      },
    });

    await logInviteHistory(
      tx,
      userId,
      invite.id,
      "create",
      "PENDING",
      "Invite created",
      ipAddress,
      userAgent,
      invite
    );

    return invite;
  });

  return apiResponse("Invite created successfully", result);
};

export const cancelInviteService = async (
  userId: string,
  inviteId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingInvite = await prisma.invite.findFirst({
    where: { id: inviteId, isActive: true },
  });

  if (!existingInvite) {
    throw new ApiError("Invite not found", StatusCodes.NOT_FOUND);
  }

  if (existingInvite.status !== "PENDING") {
    throw new ApiError("Invite cannot be cancelled", StatusCodes.BAD_REQUEST);
  }

  await prisma.$transaction(async (tx) => {
    await tx.invite.update({
      where: { id: inviteId },
      data: {
        status: "CANCELLED",
        isActive: false,
      },
    });

    await logInviteHistory(
      tx,
      userId,
      existingInvite.id,
      "cancel",
      "CANCELLED",
      reason,
      ipAddress,
      userAgent,
      existingInvite
    );
  });

  return apiResponse("Invite cancelled successfully", null);
};

