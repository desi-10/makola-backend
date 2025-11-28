import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../../utils/db.js";
import * as authServices from "./auth.services.js";
import { generateRefreshToken } from "../../utils/jwt.js";
import { clearRefreshToken, hashToken, setRefreshToken } from "./auth.utils.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/api-error.js";

export const signIn = async (req: Request, res: Response) => {
  const result = await authServices.signInService(
    req.body.email,
    req.body.password
  );

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
  const result = await authServices.signUpService(req.body);
  return res.status(StatusCodes.OK).json(result);
};

export const refreshToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken)
    throw new ApiError("No refresh token", StatusCodes.UNAUTHORIZED);

  const result = await authServices.refreshTokenService(refreshToken);

  // Set new refresh token in cookie
  setRefreshToken(res, result.data?.refreshToken as string);

  return res.status(StatusCodes.OK).json({
    message: result.message,
    data: { accessToken: result.data?.accessToken },
  });
};

export const signOut = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  const result = await authServices.signOutService(
    req.userId as string,
    refreshToken
  );
  clearRefreshToken(res);
  return res.status(StatusCodes.OK).json(result);
};

export const getSession = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const refreshToken = req.cookies.refresh_token;
  const result = await authServices.getSessionService(userId, refreshToken);
  return res.status(StatusCodes.OK).json(result);
};

export const getSessions = async (req: Request, res: Response) => {};

export const revokeSessions = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const refreshToken = req.cookies.refresh_token;
  const result = await authServices.revokeSessionsService(userId);
  return res.status(StatusCodes.OK).json(result);
};

export const revokeOtherSessions = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const refreshToken = req.cookies.refresh_token;
  const result = await authServices.revokeOtherSessionsService(
    userId,
    refreshToken
  );
  return res.status(StatusCodes.OK).json(result);
};

export const enableTwoFactor = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await authServices.enableTwoFactorService(
    userId,
    req.body.password
  );
  return res.status(StatusCodes.OK).json(result);
};

export const disableTwoFactor = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await authServices.disableTwoFactorService(
    userId,
    req.body.password
  );
  return res.status(StatusCodes.OK).json(result);
};

export const verifyTwoFactor = async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const result = await authServices.verifyTwoFactorService(
    userId,
    req.body.code
  );
  return res.status(StatusCodes.OK).json(result);
};

export const signInWithGoogle = async (req: Request, res: Response) => {
  const { code } = req.body;

  const result = await authServices.signInWithGoogleService(code, req);

  // Store app refresh token in cookie
  setRefreshToken(res, result.refreshToken);

  return res.status(StatusCodes.OK).json({
    message: "Google sign in successful",
    data: {
      accessToken: result.accessToken,
      session: {
        id: result.session.id,
        expiresAt: result.session.expiresAt,
        ipAddress: result.session.ipAddress,
        userAgent: result.session.userAgent,
      },
      user: result.user,
      googleTokens: {
        accessToken: result.googleAccessToken,
        refreshToken: result.googleRefreshToken,
      },
    },
  });
};
