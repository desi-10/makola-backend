import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/api-error.js";
import prisma from "../utils/db.js";

export async function membershipMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = (req as any).userId as string;
  const propertyId = req.params.propertyId as string;

  // const member = await prisma.propertyMembership.findUnique({
  //   where: {
  //     user_id_property_id: { user_id: userId, property_id: propertyId },
  //   },
  // });

  // if (!member)
  //   throw new ApiError(
  //     "Not a member of this property",
  //     StatusCodes.UNAUTHORIZED
  //   );

  // (req as any).membership = member;
  next();
}
