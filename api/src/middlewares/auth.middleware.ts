import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../utils/db.js";
import { hashToken } from "../utils/hash.js";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new ApiError("Invalid token", StatusCodes.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];

  try {
    // 1️⃣ Validate JWT signature + expiry
    const payload = verifyAccessToken(token);

    // 2️⃣ Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
    });
    if (!user) throw new ApiError("Invalid token", StatusCodes.UNAUTHORIZED);

    // const hashedToken = hashToken(token);

    // 4️⃣ Check session record
    const session = await prisma.session.findFirst({
      where: {
        userId: user.id,
        // token: hashedToken,
      },
    });

    if (!session) {
      // Token is valid but user has logged out
      throw new ApiError("Session expired", StatusCodes.UNAUTHORIZED);
    }

    // Attach auth user to request
    (req as any).userId = user.id;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorizeAdmin(req: Request, _: Response, next: NextFunction) {
  if (!(req as any).userId) {
    throw new ApiError(
      "You are not authorized to access this resource",
      StatusCodes.UNAUTHORIZED
    );
  }
  next();
}
