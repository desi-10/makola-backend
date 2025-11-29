import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as organizationServices from "./organization.services.js";

export const createOrganization = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await organizationServices.createOrganizationService(
    userId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const getOrganizations = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await organizationServices.getOrganizationsService(userId);
  return res.status(StatusCodes.OK).json(result);
};

export const getOrganization = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const organizationId = req.params.organizationId;
  const result = await organizationServices.getOrganizationService(
    userId,
    organizationId
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateOrganization = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const organizationId = req.params.organizationId;
  const result = await organizationServices.updateOrganizationService(
    userId,
    organizationId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || "",
    req.file
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteOrganization = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const organizationId = req.params.organizationId;
  const result = await organizationServices.deleteOrganizationService(
    userId,
    organizationId,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const getActiveOrganizations = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await organizationServices.getActiveOrganizationsService(
    userId
  );
  return res.status(StatusCodes.OK).json(result);
};

export const getOrganizationHistory = async (req: Request, res: Response) => {
  const organizationId = req.params.organizationId;

  const result = await organizationServices.getOrganizationHistoryService(
    organizationId
  );

  return res.status(StatusCodes.OK).json(result);
};

export const getOrganizationHistoryById = async (
  req: Request,
  res: Response
) => {
  const organizationId = req.params.organizationId;
  const result = await organizationServices.getOrganizationHistoryByIdService(
    organizationId
  );
  return res.status(StatusCodes.OK).json(result);
};

export const getOrganizationMembers = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await organizationServices.getOrganizationMembersService(
    userId
  );
  return res.status(StatusCodes.OK).json(result);
};
