import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as campaignServices from "./campaign.services.js";

export const getCampaigns = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await campaignServices.getCampaignsService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getCampaign = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const campaignId = req.params.campaignId as string;
  const result = await campaignServices.getCampaignService(storeId, campaignId);
  return res.status(StatusCodes.OK).json(result);
};

export const createCampaign = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await campaignServices.createCampaignService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateCampaign = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const campaignId = req.params.campaignId as string;
  const result = await campaignServices.updateCampaignService(
    userId,
    storeId,
    campaignId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteCampaign = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const campaignId = req.params.campaignId as string;
  const result = await campaignServices.deleteCampaignService(
    userId,
    storeId,
    campaignId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

