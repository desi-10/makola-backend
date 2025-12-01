import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as memberServices from "./member.services.js";

export const getMembers = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await memberServices.getMembersService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getMember = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const memberId = req.params.memberId as string;
  const result = await memberServices.getMemberService(storeId, memberId);
  return res.status(StatusCodes.OK).json(result);
};

export const createMember = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await memberServices.createMemberService(storeId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const updateMember = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const memberId = req.params.memberId as string;
  const result = await memberServices.updateMemberService(storeId, memberId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const deleteMember = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const memberId = req.params.memberId as string;
  const result = await memberServices.deleteMemberService(storeId, memberId, req.body.reason);
  return res.status(StatusCodes.OK).json(result);
};

