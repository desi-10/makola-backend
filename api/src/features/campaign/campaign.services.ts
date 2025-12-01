import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateCampaignSchemaType, UpdateCampaignSchemaType } from "./campaign.validators.js";
import { logCampaignHistory } from "./campaign.utils.js";
import { Prisma } from "@prisma/client";

export const getCampaignsService = async (storeId: string) => {
  const campaigns = await prisma.campaign.findMany({
    where: { storeId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Campaigns fetched successfully", campaigns);
};

export const getCampaignService = async (storeId: string, campaignId: string) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, storeId, isActive: true },
  });

  if (!campaign) {
    throw new ApiError("Campaign not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Campaign fetched successfully", campaign);
};

export const createCampaignService = async (
  userId: string,
  storeId: string,
  data: CreateCampaignSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  if (data.endDate <= data.startDate) {
    throw new ApiError("End date must be after start date", StatusCodes.BAD_REQUEST);
  }

  const existingCampaign = await prisma.campaign.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingCampaign) {
    throw new ApiError("Campaign already exists", StatusCodes.CONFLICT);
  }

  const result = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        storeId,
        type: data.type,
        status: "DRAFT",
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget ? new Prisma.Decimal(data.budget) : undefined,
        targetAudience: data.targetAudience ? JSON.stringify(data.targetAudience) : undefined,
        channels: data.channels || [],
        isActive: data.isActive ?? true,
      },
    });

    await logCampaignHistory(
      tx,
      userId,
      campaign.id,
      "create",
      "DRAFT",
      "Campaign created",
      ipAddress,
      userAgent,
      campaign
    );

    return campaign;
  });

  return apiResponse("Campaign created successfully", result);
};

export const updateCampaignService = async (
  userId: string,
  storeId: string,
  campaignId: string,
  data: UpdateCampaignSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingCampaign = await prisma.campaign.findFirst({
    where: { id: campaignId, storeId, isActive: true },
  });

  if (!existingCampaign) {
    throw new ApiError("Campaign not found", StatusCodes.NOT_FOUND);
  }

  if (data.endDate && data.startDate && data.endDate <= data.startDate) {
    throw new ApiError("End date must be after start date", StatusCodes.BAD_REQUEST);
  }

  if (data.name && data.name !== existingCampaign.name) {
    const conflict = await prisma.campaign.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: campaignId },
      },
    });

    if (conflict) {
      throw new ApiError("Campaign name already exists", StatusCodes.CONFLICT);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updateData: any = {
      name: data.name || existingCampaign.name,
      description: data.description ?? existingCampaign.description,
      type: data.type || existingCampaign.type,
      status: data.status || existingCampaign.status,
      startDate: data.startDate || existingCampaign.startDate,
      endDate: data.endDate || existingCampaign.endDate,
      budget: data.budget !== undefined
        ? data.budget
          ? new Prisma.Decimal(data.budget)
          : null
        : existingCampaign.budget,
      targetAudience: data.targetAudience
        ? JSON.stringify(data.targetAudience)
        : existingCampaign.targetAudience,
      channels: data.channels ?? existingCampaign.channels,
      isActive: data.isActive ?? existingCampaign.isActive,
    };

    const campaign = await tx.campaign.update({
      where: { id: campaignId },
      data: updateData,
    });

    await logCampaignHistory(
      tx,
      userId,
      campaign.id,
      "update",
      data.status || existingCampaign.status,
      "Campaign updated",
      ipAddress,
      userAgent,
      campaign
    );

    return campaign;
  });

  return apiResponse("Campaign updated successfully", result);
};

export const deleteCampaignService = async (
  userId: string,
  storeId: string,
  campaignId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingCampaign = await prisma.campaign.findFirst({
    where: { id: campaignId, storeId, isActive: true },
  });

  if (!existingCampaign) {
    throw new ApiError("Campaign not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: "CANCELLED",
      },
    });

    await logCampaignHistory(
      tx,
      userId,
      existingCampaign.id,
      "delete",
      "CANCELLED",
      reason,
      ipAddress,
      userAgent,
      existingCampaign
    );
  });

  return apiResponse("Campaign deleted successfully", null);
};

