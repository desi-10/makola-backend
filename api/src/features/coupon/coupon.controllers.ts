import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as couponServices from "./coupon.services.js";

export const getCoupons = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await couponServices.getCouponsService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getCoupon = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const couponId = req.params.couponId as string;
  const result = await couponServices.getCouponService(storeId, couponId);
  return res.status(StatusCodes.OK).json(result);
};

export const getCouponByCode = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const code = req.params.code as string;
  const result = await couponServices.getCouponByCodeService(storeId, code);
  return res.status(StatusCodes.OK).json(result);
};

export const createCoupon = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await couponServices.createCouponService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateCoupon = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const couponId = req.params.couponId as string;
  const result = await couponServices.updateCouponService(
    userId,
    storeId,
    couponId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteCoupon = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const couponId = req.params.couponId as string;
  const result = await couponServices.deleteCouponService(
    userId,
    storeId,
    couponId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

