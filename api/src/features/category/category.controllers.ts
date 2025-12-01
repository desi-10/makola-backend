import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as categoryServices from "./category.services.js";

export const getCategories = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await categoryServices.getCategoriesService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const createCategory = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;

  const result = await categoryServices.createCategoryService(
    userId,
    storeId,
    req.body,
    req.file,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );

  return res.status(StatusCodes.OK).json(result);
};

export const getCategory = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const categoryId = req.params.categoryId as string;

  const result = await categoryServices.getCategoryService(storeId, categoryId);
  return res.status(StatusCodes.OK).json(result);
};

export const updateCategory = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const categoryId = req.params.categoryId as string;

  const result = await categoryServices.updateCategoryService(
    userId,
    storeId,
    categoryId,
    req.body,
    req.file,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );

  return res.status(StatusCodes.OK).json(result);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const categoryId = req.params.categoryId as string;

  const result = await categoryServices.deleteCategoryService(
    userId,
    storeId,
    categoryId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );

  return res.status(StatusCodes.OK).json(result);
};
