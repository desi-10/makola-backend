import { Request, Response, NextFunction } from "express";
import prisma from "../../utils/db.js";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/api-error.js";
import { StoreMember } from "@prisma/client";

export const storeMembershipMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req as any).userId as string;
  const organizationId = (req as any).organizationMembership
    ?.organizationId as string;
  const storeId = req.params.storeId as string;

  console.log(req.params, "req.params middleware");

  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      organizationId: organizationId,
    },
    include: {
      members: true,
    },
  });

  if (!store) {
    throw new ApiError("Store not found", StatusCodes.NOT_FOUND);
  }

  if (!store.members.some((member: StoreMember) => member.userId === userId)) {
    throw new ApiError("Not a member of this store", StatusCodes.UNAUTHORIZED);
  }

  (req as any).storeId = store.id;
  next();
};
