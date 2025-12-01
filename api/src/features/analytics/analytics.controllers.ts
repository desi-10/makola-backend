import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as analyticsServices from "./analytics.services.js";

export const getSalesAnalytics = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const result = await analyticsServices.getSalesAnalyticsService(storeId, startDate, endDate);
  return res.status(StatusCodes.OK).json(result);
};

export const getProductAnalytics = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const result = await analyticsServices.getProductAnalyticsService(storeId, startDate, endDate);
  return res.status(StatusCodes.OK).json(result);
};

export const getMarketingAnalytics = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const result = await analyticsServices.getMarketingAnalyticsService(storeId, startDate, endDate);
  return res.status(StatusCodes.OK).json(result);
};

export const getInventoryAnalytics = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await analyticsServices.getInventoryAnalyticsService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getCustomerAnalytics = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const result = await analyticsServices.getCustomerAnalyticsService(storeId, startDate, endDate);
  return res.status(StatusCodes.OK).json(result);
};

