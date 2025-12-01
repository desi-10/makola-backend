import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as roleServices from "./role.services.js";

export const getRoles = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await roleServices.getRolesService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getRole = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const roleId = req.params.roleId as string;
  const result = await roleServices.getRoleService(storeId, roleId);
  return res.status(StatusCodes.OK).json(result);
};

export const getPermissions = async (req: Request, res: Response) => {
  const result = await roleServices.getPermissionsService();
  return res.status(StatusCodes.OK).json(result);
};

export const createRole = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await roleServices.createRoleService(storeId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const updateRole = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const roleId = req.params.roleId as string;
  const result = await roleServices.updateRoleService(storeId, roleId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const assignPermission = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const roleId = req.params.roleId as string;
  const result = await roleServices.assignPermissionService(storeId, roleId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const removePermission = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const roleId = req.params.roleId as string;
  const permissionId = req.params.permissionId as string;
  const result = await roleServices.removePermissionService(storeId, roleId, permissionId);
  return res.status(StatusCodes.OK).json(result);
};

export const deleteRole = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const roleId = req.params.roleId as string;
  const result = await roleServices.deleteRoleService(storeId, roleId);
  return res.status(StatusCodes.OK).json(result);
};

