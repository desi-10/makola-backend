import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateMemberSchemaType, UpdateMemberSchemaType } from "./member.validators.js";

export const getMembersService = async (storeId: string) => {
  const members = await prisma.storeMember.findMany({
    where: { storeId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Members fetched successfully", members);
};

export const getMemberService = async (storeId: string, memberId: string) => {
  const member = await prisma.storeMember.findFirst({
    where: { id: memberId, storeId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      role: true,
    },
  });

  if (!member) {
    throw new ApiError("Member not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Member fetched successfully", member);
};

export const createMemberService = async (
  storeId: string,
  data: CreateMemberSchemaType
) => {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }

  // Validate role exists and belongs to store
  const role = await prisma.storeRole.findFirst({
    where: { id: data.roleId, storeId, isActive: true },
  });

  if (!role) {
    throw new ApiError("Role not found", StatusCodes.NOT_FOUND);
  }

  // Check if member already exists
  const existingMember = await prisma.storeMember.findUnique({
    where: {
      userId_storeId: {
        userId: data.userId,
        storeId,
      },
    },
  });

  if (existingMember) {
    if (existingMember.isActive) {
      throw new ApiError("User is already a member", StatusCodes.CONFLICT);
    } else {
      // Re-activate existing membership
      const member = await prisma.storeMember.update({
        where: { id: existingMember.id },
        data: {
          roleId: data.roleId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          role: true,
        },
      });

      return apiResponse("Member added successfully", member);
    }
  }

  const member = await prisma.storeMember.create({
    data: {
      userId: data.userId,
      storeId,
      roleId: data.roleId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      role: true,
    },
  });

  return apiResponse("Member added successfully", member);
};

export const updateMemberService = async (
  storeId: string,
  memberId: string,
  data: UpdateMemberSchemaType
) => {
  const existingMember = await prisma.storeMember.findFirst({
    where: { id: memberId, storeId, isActive: true },
  });

  if (!existingMember) {
    throw new ApiError("Member not found", StatusCodes.NOT_FOUND);
  }

  if (data.roleId) {
    const role = await prisma.storeRole.findFirst({
      where: { id: data.roleId, storeId, isActive: true },
    });

    if (!role) {
      throw new ApiError("Role not found", StatusCodes.NOT_FOUND);
    }
  }

  const member = await prisma.storeMember.update({
    where: { id: memberId },
    data: {
      roleId: data.roleId || existingMember.roleId,
      isActive: data.isActive ?? existingMember.isActive,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      role: true,
    },
  });

  return apiResponse("Member updated successfully", member);
};

export const deleteMemberService = async (storeId: string, memberId: string, reason: string) => {
  const existingMember = await prisma.storeMember.findFirst({
    where: { id: memberId, storeId, isActive: true },
  });

  if (!existingMember) {
    throw new ApiError("Member not found", StatusCodes.NOT_FOUND);
  }

  await prisma.storeMember.update({
    where: { id: memberId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return apiResponse("Member removed successfully", null);
};

