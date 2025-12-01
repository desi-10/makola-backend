import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as productServices from "./product.services.js";

export const getProducts = async (req: Request, res: Response) => {
  const storeId = req.params.storeId as string;
  const result = await productServices.getProductsService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const createProduct = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = req.params.storeId as string;

  const result = await productServices.createProductService(
    userId,
    storeId,
    req.body,
    req.file,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );

  return res.status(StatusCodes.OK).json(result);
};

export const getProduct = async (req: Request, res: Response) => {
  const storeId = req.params.storeId as string;
  const productId = req.params.productId as string;

  const result = await productServices.getProductService(storeId, productId);
  return res.status(StatusCodes.OK).json(result);
};

export const updateProduct = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = req.params.storeId as string;
  const productId = req.params.productId as string;

  const result = await productServices.updateProductService(
    userId,
    storeId,
    productId,
    req.body,
    req.file,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );

  return res.status(StatusCodes.OK).json(result);
};

export const deleteProduct = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = req.params.storeId as string;
  const productId = req.params.productId as string;

  const result = await productServices.deleteProductService(
    userId,
    storeId,
    productId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );

  return res.status(StatusCodes.OK).json(result);
};


