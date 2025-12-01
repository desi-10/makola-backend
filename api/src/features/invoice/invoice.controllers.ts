import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as invoiceServices from "./invoice.services.js";

export const getInvoices = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await invoiceServices.getInvoicesService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getInvoice = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const invoiceId = req.params.invoiceId as string;
  const result = await invoiceServices.getInvoiceService(storeId, invoiceId);
  return res.status(StatusCodes.OK).json(result);
};

export const createInvoice = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await invoiceServices.createInvoiceService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateInvoice = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const invoiceId = req.params.invoiceId as string;
  const result = await invoiceServices.updateInvoiceService(
    userId,
    storeId,
    invoiceId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const invoiceId = req.params.invoiceId as string;
  const result = await invoiceServices.deleteInvoiceService(
    userId,
    storeId,
    invoiceId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

