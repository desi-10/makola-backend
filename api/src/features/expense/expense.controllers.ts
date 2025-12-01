import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as expenseServices from "./expense.services.js";

export const getExpenses = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const result = await expenseServices.getExpensesService(storeId);
  return res.status(StatusCodes.OK).json(result);
};

export const getExpense = async (req: Request, res: Response) => {
  const storeId = (req as any).storeId as string;
  const expenseId = req.params.expenseId as string;
  const result = await expenseServices.getExpenseService(storeId, expenseId);
  return res.status(StatusCodes.OK).json(result);
};

export const createExpense = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const result = await expenseServices.createExpenseService(
    userId,
    storeId,
    req.body,
    req.file,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const updateExpense = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const expenseId = req.params.expenseId as string;
  const result = await expenseServices.updateExpenseService(
    userId,
    storeId,
    expenseId,
    req.body,
    req.file,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

export const deleteExpense = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const storeId = (req as any).storeId as string;
  const expenseId = req.params.expenseId as string;
  const result = await expenseServices.deleteExpenseService(
    userId,
    storeId,
    expenseId,
    req.body.reason,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};

