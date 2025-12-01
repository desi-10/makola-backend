import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateRoleSchemaType, UpdateRoleSchemaType, AssignPermissionSchemaType } from "./role.validators.js";

export const getRolesService = async (storeId: string) => {
  const roles = await prisma.storeRole.findMany({
    where: { storeId, isActive: true },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Roles fetched successfully", roles);
};

export const getRoleService = async (storeId: string, roleId: string) => {
  const role = await prisma.storeRole.findFirst({
    where: { id: roleId, storeId, isActive: true },
    include: {
      rolePermissions: {
        include: { permission: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    throw new ApiError("Role not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Role fetched successfully", role);
};

export const getPermissionsService = async () => {
  const permissions = await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });

  return apiResponse("Permissions fetched successfully", permissions);
};

export const createRoleService = async (
  storeId: string,
  data: CreateRoleSchemaType
) => {
  const existingRole = await prisma.storeRole.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingRole) {
    throw new ApiError("Role already exists", StatusCodes.CONFLICT);
  }

  const result = await prisma.$transaction(async (tx) => {
    const role = await tx.storeRole.create({
      data: {
        name: data.name,
        description: data.description,
        storeId,
      },
    });

    // Assign permissions if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      for (const permissionId of data.permissionIds) {
        const permission = await tx.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          throw new ApiError(`Permission ${permissionId} not found`, StatusCodes.NOT_FOUND);
        }

        await tx.storeRolePermission.create({
          data: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }

    return await tx.storeRole.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  });

  return apiResponse("Role created successfully", result);
};

export const updateRoleService = async (
  storeId: string,
  roleId: string,
  data: UpdateRoleSchemaType
) => {
  const existingRole = await prisma.storeRole.findFirst({
    where: { id: roleId, storeId, isActive: true },
  });

  if (!existingRole) {
    throw new ApiError("Role not found", StatusCodes.NOT_FOUND);
  }

  if (data.name && data.name !== existingRole.name) {
    const conflict = await prisma.storeRole.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: roleId },
      },
    });

    if (conflict) {
      throw new ApiError("Role name already exists", StatusCodes.CONFLICT);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update role
    await tx.storeRole.update({
      where: { id: roleId },
      data: {
        name: data.name || existingRole.name,
        description: data.description ?? existingRole.description,
        isActive: data.isActive ?? existingRole.isActive,
      },
    });

    // Update permissions if provided
    if (data.permissionIds !== undefined) {
      // Delete existing permissions
      await tx.storeRolePermission.deleteMany({
        where: { roleId },
      });

      // Add new permissions
      for (const permissionId of data.permissionIds) {
        const permission = await tx.permission.findUnique({
          where: { id: permissionId },
        });

        if (!permission) {
          throw new ApiError(`Permission ${permissionId} not found`, StatusCodes.NOT_FOUND);
        }

        await tx.storeRolePermission.create({
          data: {
            roleId,
            permissionId,
          },
        });
      }
    }

    return await tx.storeRole.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });
  });

  return apiResponse("Role updated successfully", result);
};

export const assignPermissionService = async (
  storeId: string,
  roleId: string,
  data: AssignPermissionSchemaType
) => {
  const role = await prisma.storeRole.findFirst({
    where: { id: roleId, storeId, isActive: true },
  });

  if (!role) {
    throw new ApiError("Role not found", StatusCodes.NOT_FOUND);
  }

  const permission = await prisma.permission.findUnique({
    where: { id: data.permissionId },
  });

  if (!permission) {
    throw new ApiError("Permission not found", StatusCodes.NOT_FOUND);
  }

  const existing = await prisma.storeRolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId: data.permissionId,
      },
    },
  });

  if (existing) {
    throw new ApiError("Permission already assigned", StatusCodes.CONFLICT);
  }

  const rolePermission = await prisma.storeRolePermission.create({
    data: {
      roleId,
      permissionId: data.permissionId,
    },
    include: {
      permission: true,
    },
  });

  return apiResponse("Permission assigned successfully", rolePermission);
};

export const removePermissionService = async (
  storeId: string,
  roleId: string,
  permissionId: string
) => {
  const role = await prisma.storeRole.findFirst({
    where: { id: roleId, storeId, isActive: true },
  });

  if (!role) {
    throw new ApiError("Role not found", StatusCodes.NOT_FOUND);
  }

  await prisma.storeRolePermission.deleteMany({
    where: {
      roleId,
      permissionId,
    },
  });

  return apiResponse("Permission removed successfully", null);
};

export const deleteRoleService = async (storeId: string, roleId: string) => {
  const existingRole = await prisma.storeRole.findFirst({
    where: { id: roleId, storeId, isActive: true },
  });

  if (!existingRole) {
    throw new ApiError("Role not found", StatusCodes.NOT_FOUND);
  }

  await prisma.storeRole.update({
    where: { id: roleId },
    data: {
      deletedAt: new Date(),
      isActive: false,
    },
  });

  return apiResponse("Role deleted successfully", null);
};

