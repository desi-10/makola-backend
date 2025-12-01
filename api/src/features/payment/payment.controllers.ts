import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as paymentServices from "./payment.services.js";

export const getPayments = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await paymentServices.getPaymentsService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getPayment = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const paymentId = req.params.paymentId as string;
  const result = await paymentServices.getPaymentService(storeId, paymentId);
  return res.status(StatusCodes.OK).json(result);
};

export const createPayment = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await paymentServices.createPaymentService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updatePayment = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const paymentId = req.params.paymentId as string;
  const result = await paymentServices.updatePaymentService(
    userId,
    storeId,
    paymentId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deletePayment = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const paymentId = req.params.paymentId as string;
  const result = await paymentServices.deletePaymentService(
    userId,
    storeId,
    paymentId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

