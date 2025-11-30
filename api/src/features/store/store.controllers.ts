import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as storeServices from "./store.services.js";

export const getStores = async (req: Request, res: Response) => {
  const organizationId = req.organizationId as string;
  const result = await storeServices.getStoresService(organizationId);
  return res.status(StatusCodes.OK).json(result);
};

export const createStore = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const organizationId = req.organizationId as string;

  const result = await storeServices.createStoreService(
    userId,
    organizationId,
    req.body,
    req.file,
    req.ip as string,
    req.headers["user-agent"] as string
  );

  return res.status(StatusCodes.OK).json(result);
};

export const getStore = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const organizationId = req.organizationId as string;
  const storeId = req.params.storeId;
  const result = await storeServices.getStoreService(
    userId,
    organizationId,
    storeId
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateStore = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const storeId = req.params.storeId;
  const organizationId = req.organizationId as string;
  const result = await storeServices.updateStoreService(
    userId,
    organizationId,
    storeId,
    req.body,
    req.file,
    req.ip as string,
    req.headers["user-agent"] as string
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteStore = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const organizationId = req.organizationId as string;
  const storeId = req.params.storeId;
  const result = await storeServices.deleteStoreService(
    userId,
    organizationId,
    storeId,
    req.body.reason,
    req.ip as string,
    req.headers["user-agent"] as string
  );
  return res.status(StatusCodes.OK).json(result);
};

export const getStoreHistory = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const organizationId = req.organizationId as string;
  const storeId = req.params.storeId;
  const result = await storeServices.getStoreHistoryService(
    userId,
    organizationId,
    storeId
  );
  return res.status(StatusCodes.OK).json(result);
};

export const getStoreHistoryById = async (req: Request, res: Response) => {
  const storeHistoryId = req.params.storeHistoryId;
  const result = await storeServices.getStoreHistoryByIdService(storeHistoryId);
  return res.status(StatusCodes.OK).json(result);
};
