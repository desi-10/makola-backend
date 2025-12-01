import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as dashboardServices from "./dashboard.services.js";

export const getDashboard = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await dashboardServices.getDashboardService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

