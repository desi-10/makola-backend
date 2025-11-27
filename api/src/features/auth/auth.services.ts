import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/api-error.js";
import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { SignUpSchemaType } from "./auth.validators.js";
import { logger } from "../../utils/logger.js";
import {
  bcryptCompareHashed,
  bcryptHashed,
  hashToken,
} from "../../utils/hash.js";

export const signInService = async (email: string, password: string) => {
  logger.info(`Signing in user with email ${email}`);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.error(`User not found with email ${email}`);
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }

  const isPasswordValid = await bcryptCompareHashed(
    password,
    user?.password as string
  );
  if (!isPasswordValid)
    throw new ApiError("Invalid password", StatusCodes.UNPROCESSABLE_ENTITY);
  logger.info(`User ${user.id} signed in successfully`);

  const accessToken = generateAccessToken(user.id);

  return apiResponse("Sign in successful", {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
  });
};

export const signUpService = async (data: SignUpSchemaType) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingUser)
    throw new ApiError("User already exists", StatusCodes.CONFLICT);

  const hashedPassword = await bcryptHashed(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
    },
  });

  return apiResponse("Sign up successful", {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    },
  });
};

export const refreshTokenService = async (refreshToken: string) => {
  // 1. Verify the refresh token signature
  const payload = verifyRefreshToken(refreshToken);

  if (!payload?.id) {
    throw new ApiError("Invalid token", StatusCodes.UNAUTHORIZED);
  }

  const userId = payload.id;

  // 2. Hash token BEFORE checking DB
  // This prevents someone who steals DB values from using refresh tokens
  const hashedToken = hashToken(refreshToken);

  // 3. Find matching session
  const session = await prisma.session.findFirst({
    where: {
      userId,
      token: hashedToken,
    },
  });

  if (!session) {
    throw new ApiError("Session not found", StatusCodes.UNAUTHORIZED);
  }

  logger.info(`Session found for user ${userId}`);

  // 4. Rotate refresh token (VERY IMPORTANT SECURITY)
  const newRefreshToken = generateRefreshToken(userId);
  const hashedNewToken = hashToken(newRefreshToken);

  await prisma.session.update({
    where: { id: session.id },
    data: { token: hashedNewToken },
  });

  // 5. Create new access token
  const newAccessToken = generateAccessToken(userId);

  return apiResponse("Token refreshed successfully", {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

export const signOutService = async (userId: string) => {
  const session = await prisma.session.findFirst({
    where: { userId },
  });

  if (!session) throw new ApiError("Session not found", StatusCodes.NOT_FOUND);

  await prisma.session.delete({
    where: { id: session.id },
  });

  return apiResponse("Sign out successful", null);
};
