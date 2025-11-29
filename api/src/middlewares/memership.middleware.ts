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
  const organizationId = req.params.organizationId as string;

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organizationId,
        userId: userId,
      },
    },
  });

  if (!membership)
    throw new ApiError(
      "Not a member of this organization",
      StatusCodes.UNAUTHORIZED
    );

  (req as any).membership = membership;
  next();
}
