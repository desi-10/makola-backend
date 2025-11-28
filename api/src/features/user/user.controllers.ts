import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as userServices from "./user.services.js";
import { clearRefreshToken } from "../auth/auth.utils.js";

export const getMe = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await userServices.getMeService(userId);
  return res.status(StatusCodes.OK).json(result);
};

export const updateMe = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await userServices.updateMeService(userId, req.body, req.file);
  return res.status(StatusCodes.OK).json(result);
};

export const updatePassword = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await userServices.updatePasswordService(userId, req.body);
  clearRefreshToken(res);
  return res.status(StatusCodes.OK).json(result);
};
