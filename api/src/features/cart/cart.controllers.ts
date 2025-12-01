import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as cartServices from "./cart.services.js";

export const getCarts = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await cartServices.getCartsService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getAbandonedCarts = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const hoursAgo = req.query.hoursAgo ? parseInt(req.query.hoursAgo as string) : 24;
  const result = await cartServices.getAbandonedCartsService(storeId, hoursAgo);
  return res.status(StatusCodes.OK).json(result);
};

export const getCart = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const cartId = req.params.cartId as string;
  const result = await cartServices.getCartService(storeId, cartId);
  return res.status(StatusCodes.OK).json(result);
};

export const createCart = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await cartServices.createCartService(storeId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const updateCart = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const cartId = req.params.cartId as string;
  const result = await cartServices.updateCartService(storeId, cartId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const markCartAbandoned = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const cartId = req.params.cartId as string;
  const result = await cartServices.markCartAbandonedService(storeId, cartId);
  return res.status(StatusCodes.OK).json(result);
};

export const convertCartToOrder = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const cartId = req.params.cartId as string;
  const result = await cartServices.convertCartToOrderService(storeId, cartId, req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const deleteCart = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const cartId = req.params.cartId as string;
  const result = await cartServices.deleteCartService(storeId, cartId);
  return res.status(StatusCodes.OK).json(result);
};

