import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as newsletterServices from "./newsletter.services.js";

export const getNewsletters = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await newsletterServices.getNewslettersService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getNewsletter = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const newsletterId = req.params.newsletterId as string;
  const result = await newsletterServices.getNewsletterService(storeId, newsletterId);
  return res.status(StatusCodes.OK).json(result);
};

export const getSubscribers = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await newsletterServices.getSubscribersService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const subscribeNewsletter = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await newsletterServices.subscribeNewsletterService(storeId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const unsubscribeNewsletter = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const email = req.params.email as string;
  const result = await newsletterServices.unsubscribeNewsletterService(storeId, email);
  return res.status(StatusCodes.OK).json(result);
};

export const createNewsletter = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await newsletterServices.createNewsletterService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateNewsletter = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const newsletterId = req.params.newsletterId as string;
  const result = await newsletterServices.updateNewsletterService(
    userId,
    storeId,
    newsletterId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteNewsletter = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const newsletterId = req.params.newsletterId as string;
  const result = await newsletterServices.deleteNewsletterService(
    userId,
    storeId,
    newsletterId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

