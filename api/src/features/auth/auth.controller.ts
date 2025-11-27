import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../../utils/db.js";
import {
  refreshTokenService,
  sessionService,
  signInService,
  signOutService,
  signUpService,
} from "./auth.services.js";
import { generateRefreshToken } from "../../utils/jwt.js";
import { clearRefreshToken, setRefreshToken } from "./auth.utils.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/api-error.js";
import { hashToken } from "../../utils/hash.js";

export const signIn = async (req: Request, res: Response) => {
  const result = await signInService(req.body.email, req.body.password);

  const refreshToken = generateRefreshToken(result.data?.user?.id as string);
  const hashedRefreshToken = hashToken(refreshToken);

  logger.info(`Creating session for user ${result.data?.user?.id}`);
  const session = await prisma.session.create({
    data: {
      userId: result.data?.user?.id as string,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          emailVerified: true,
        },
      },
    },
  });

  // store refresh token in httpOnly cookie
  setRefreshToken(res, refreshToken);

  return res.status(StatusCodes.OK).json({
    message: result.message,
    data: {
      accessToken: result.data?.accessToken,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
      user: session.user,
    },
  });
};

export const signUp = async (req: Request, res: Response) => {
  const result = await signUpService(req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken)
    throw new ApiError("No refresh token", StatusCodes.UNAUTHORIZED);

  const result = await refreshTokenService(refreshToken);

  // Set new refresh token in cookie
  setRefreshToken(res, result.data?.refreshToken as string);

  return res.status(StatusCodes.OK).json({
    message: result.message,
    data: { accessToken: result.data?.accessToken },
  });
};

export const signOut = async (req: Request, res: Response) => {
  const result = await signOutService(req.userId as string);
  clearRefreshToken(res);
  return res.status(StatusCodes.OK).json(result);
};

export const session = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await sessionService(userId);
  return res.status(StatusCodes.OK).json(result);
};
