import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as discountServices from "./discount.services.js";

export const getDiscounts = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await discountServices.getDiscountsService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getDiscount = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const discountId = req.params.discountId as string;
  const result = await discountServices.getDiscountService(storeId, discountId);
  return res.status(StatusCodes.OK).json(result);
};

export const createDiscount = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await discountServices.createDiscountService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateDiscount = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const discountId = req.params.discountId as string;
  const result = await discountServices.updateDiscountService(
    userId,
    storeId,
    discountId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteDiscount = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const discountId = req.params.discountId as string;
  const result = await discountServices.deleteDiscountService(
    userId,
    storeId,
    discountId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};
