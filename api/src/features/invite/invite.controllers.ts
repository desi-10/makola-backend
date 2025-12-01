import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as inviteServices from "./invite.services.js";

export const getInvites = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string | null;
  const organizationId = (req as any).organizationMembership?.organizationId as string | null;
  const result = await inviteServices.getInvitesService(storeId, organizationId);
  return res.status(StatusCodes.OK).json(result);
};

export const getInvite = async (req: Request, res: Response) => {
  const inviteId = req.params.inviteId as string;
  const result = await inviteServices.getInviteService(inviteId);
  return res.status(StatusCodes.OK).json(result);
};

export const getInviteByToken = async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const result = await inviteServices.getInviteByTokenService(token);
  return res.status(StatusCodes.OK).json(result);
};

export const createInvite = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string | null;
  const organizationId = (req as any).organizationMembership?.organizationId as string | null;
  const result = await inviteServices.createInviteService(
    userId,
    storeId,
    organizationId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const cancelInvite = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const inviteId = req.params.inviteId as string;
  const result = await inviteServices.cancelInviteService(
    userId,
    inviteId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

