import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as flashSaleServices from "./flashsale.services.js";

export const getFlashSales = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await flashSaleServices.getFlashSalesService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getActiveFlashSales = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await flashSaleServices.getActiveFlashSalesService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getFlashSale = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const flashSaleId = req.params.flashSaleId as string;
  const result = await flashSaleServices.getFlashSaleService(storeId, flashSaleId);
  return res.status(StatusCodes.OK).json(result);
};

export const createFlashSale = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await flashSaleServices.createFlashSaleService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateFlashSale = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const flashSaleId = req.params.flashSaleId as string;
  const result = await flashSaleServices.updateFlashSaleService(
    userId,
    storeId,
    flashSaleId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteFlashSale = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const flashSaleId = req.params.flashSaleId as string;
  const result = await flashSaleServices.deleteFlashSaleService(
    userId,
    storeId,
    flashSaleId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

