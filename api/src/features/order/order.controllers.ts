import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as orderServices from "./order.services.js";

export const getOrders = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await orderServices.getOrdersService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getOrder = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const orderId = req.params.orderId as string;
  const result = await orderServices.getOrderService(storeId, orderId);
  return res.status(StatusCodes.OK).json(result);
};

export const createOrder = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await orderServices.createOrderService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateOrder = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const orderId = req.params.orderId as string;
  const result = await orderServices.updateOrderService(
    userId,
    storeId,
    orderId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteOrder = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const orderId = req.params.orderId as string;
  const result = await orderServices.deleteOrderService(
    userId,
    storeId,
    orderId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};
