import prisma from "../../utils/db.js";
import {
  CreateOrganizationSchemaType,
  UpdateOrganizationSchemaType,
} from "./organization.validators.js";
import { apiResponse } from "../../utils/api-response.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { slugifyText } from "../../utils/slugify.js";
import { logOrganizationHistory } from "./organization.utils.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";

export const createOrganizationService = async (
  userId: string,
  data: CreateOrganizationSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingOrganization = await prisma.organization.findFirst({
    where: {
      name: data.name,
      userId: userId,
      isActive: true,
    },
  });

  if (existingOrganization) {
    throw new ApiError("Organization already exists", StatusCodes.CONFLICT);
  }

  const organization = await prisma.organization.create({
    data: {
      name: data.name,
      description: data.description,
      userId: userId,
      slug: slugifyText(data.name),
    },
  });

  const role = await prisma.organizationRole.create({
    data: {
      name: "owner",
      description: "Owner of the organization",
      organizationId: organization.id,
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: organization.id,
      userId: userId,
      roleId: role.id,
    },
  });

  await logOrganizationHistory(
    userId,
    organization.id,
    "create",
    "Organization created successfully",
    ipAddress,
    userAgent,
    organization
  );

  return apiResponse("Organization created successfully", organization);
};

export const getOrganizationsService = async (userId: string) => {
  const organizations = await prisma.organization.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return apiResponse("Organizations fetched successfully", organizations);
};

export const getActiveOrganizationsService = async (userId: string) => {
  const organizations = await prisma.organization.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return apiResponse(
    "Active organizations fetched successfully",
    organizations
  );
};

export const getOrganizationService = async (
  userId: string,
  organizationId: string
) => {
  const organization = await prisma.organization.findUnique({
    where: { id_userId: { id: organizationId, userId }, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!organization) {
    throw new ApiError("Organization not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Organization fetched successfully", organization);
};

export const updateOrganizationService = async (
  userId: string,
  organizationId: string,
  data: UpdateOrganizationSchemaType,
  ipAddress: string,
  userAgent: string,
  file: Express.Multer.File | undefined
) => {
  const existingOrganization = await prisma.organization.findUnique({
    where: { id_userId: { id: organizationId, userId } },
  });

  if (!existingOrganization) {
    throw new ApiError("Organization not found", StatusCodes.NOT_FOUND);
  }

  let image = existingOrganization.image;
  if (file) {
    const uploadedImage = await uploadToCloudinary(
      "organizations",
      file.buffer
    );
    image = uploadedImage.secure_url;
    if (existingOrganization.image)
      await deleteFromCloudinary(existingOrganization.image);
  }

  const organization = await prisma.organization.update({
    where: { id_userId: { id: organizationId, userId } },
    data: {
      name: data.name || existingOrganization.name,
      description: data.description || existingOrganization.description,
      image: image,
      isActive: data.isActive ?? existingOrganization.isActive,
    },
  });

  await logOrganizationHistory(
    userId,
    organization.id,
    "update",
    "Organization updated successfully",
    ipAddress,
    userAgent,
    organization
  );

  return apiResponse("Organization updated successfully", organization);
};

export const deleteOrganizationService = async (
  userId: string,
  organizationId: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingOrganization = await prisma.organization.findUnique({
    where: { id_userId: { id: organizationId, userId } },
  });

  if (!existingOrganization) {
    throw new ApiError("Organization not found", StatusCodes.NOT_FOUND);
  }
  await prisma.organization.update({
    where: { id_userId: { id: organizationId, userId } },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  await logOrganizationHistory(
    userId,
    organizationId,
    "delete",
    "Organization deleted successfully",
    ipAddress,
    userAgent,
    existingOrganization
  );

  return apiResponse("Organization deleted successfully", null);
};

export const getOrganizationHistoryService = async (organizationId: string) => {
  const history = await prisma.organizationHistory.findMany({
    where: { organizationId },
    select: {
      id: true,
      doer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      action: true,
      meta: true,
      reason: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const parsedHistory = history.map((item) => {
    return {
      ...item,
      meta: JSON.parse(item.meta as string),
    };
  });

  return apiResponse(
    "Organization history fetched successfully",
    parsedHistory
  );
};

export const getOrganizationHistoryByIdService = async (
  organizationHistoryId: string
) => {
  const history = await prisma.organizationHistory.findUnique({
    where: { id: organizationHistoryId },
    select: {
      id: true,
      doer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      action: true,
      meta: true,
      reason: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!history) {
    throw new ApiError("Organization history not found", StatusCodes.NOT_FOUND);
  }

  const parsedHistory = {
    ...history,
    meta: JSON.parse(history.meta as string),
  };

  return apiResponse(
    "Organization history fetched successfully",
    parsedHistory
  );
};

export const getOrganizationMembersService = async (userId: string) => {
  const members = await prisma.organizationMember.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      isActive: true,
      organization: {
        select: {
          id: true,
          name: true,
          image: true,
          description: true,
          slug: true,
          roles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return apiResponse("Organization members fetched successfully", members);
};
