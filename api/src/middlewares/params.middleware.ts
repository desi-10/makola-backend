import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/api-error.js";

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      throw new ApiError(
        "Invalid route parameters.",
        StatusCodes.UNPROCESSABLE_ENTITY
      );
    }

    req.params = result.data as any;
    next();
  };
};
