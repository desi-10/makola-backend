import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/api-error.js";
import { StatusCodes } from "http-status-codes";

export const validateSchema =
  (schema: ZodSchema) => (req: Request, _: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const formattedErrors = parsed.error.flatten();

      throw new ApiError(
        "Validation failed. Please check your input data.",
        StatusCodes.UNPROCESSABLE_ENTITY,
        true,
        formattedErrors
      );
    }

    // Replace req.body with validated data (optional, but recommended)
    req.body = parsed.data;
    next();
  };
