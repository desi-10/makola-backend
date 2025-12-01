import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as inventoryServices from "./inventory.services.js";

export const getInventories = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await inventoryServices.getInventoriesService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getInventory = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const inventoryId = req.params.inventoryId as string;
  const result = await inventoryServices.getInventoryService(
    storeId,
    inventoryId
  );
  return res.status(StatusCodes.OK).json(result);
};

export const createInventory = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await inventoryServices.createInventoryService(
    userId,
    storeId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateInventory = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const inventoryId = req.params.inventoryId as string;
  const result = await inventoryServices.updateInventoryService(
    userId,
    storeId,
    inventoryId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const adjustInventory = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const inventoryId = req.params.inventoryId as string;
  const result = await inventoryServices.adjustInventoryService(
    userId,
    storeId,
    inventoryId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteInventory = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const inventoryId = req.params.inventoryId as string;
  const result = await inventoryServices.deleteInventoryService(
    userId,
    storeId,
    inventoryId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};
