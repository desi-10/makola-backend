import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/api-error.js";
import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import {
  ForgotPasswordSchemaType,
  ResetPasswordSchemaType,
  SignUpSchemaType,
} from "./auth.validators.js";
import { generateCode } from "../../utils/generate-code.js";
import { bcryptCompareHashed, bcryptHashed, hashToken } from "./auth.utils.js";
import { GOOGLE_SCOPES, googleOAuthClient } from "../../config/google.js";
import { Request } from "express";

export const signInService = async (
  email: string,
  password: string,
  code?: string
) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      accounts: true,
      organizations: true,
      organizationMembers: {
        include: {
          organization: true,
          role: true,
        },
      },
    },
  });

  console.log(user, "user");

  if (!user) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }

  if (user.isTwoFactorEnabled && !code) {
    const twoFactorCode = generateCode();
    await prisma.verification.create({
      data: {
        expiresAt: new Date(Date.now() + 3 * 60 * 1000),
        identifier: user.id,
        value: hashToken(twoFactorCode),
      },
    });
    return apiResponse("Two factor code has been sent to your email", {
      isTwoFactorEnabled: true,
      code: twoFactorCode,
    });
  }

  if (!user.password)
    throw new ApiError(
      "User has no password",
      StatusCodes.UNPROCESSABLE_ENTITY
    );

  const isPasswordValid = await bcryptCompareHashed(
    password,
    user?.password as string
  );
  if (!isPasswordValid)
    throw new ApiError("Invalid password", StatusCodes.UNPROCESSABLE_ENTITY);

  if (user.isTwoFactorEnabled && code) {
    const verification = await prisma.verification.findFirst({
      where: { identifier: user.id, value: hashToken(code as string) },
    });
    if (!verification)
      throw new ApiError("Invalid code", StatusCodes.UNPROCESSABLE_ENTITY);
    if (verification.expiresAt < new Date())
      throw new ApiError("Code expired", StatusCodes.UNPROCESSABLE_ENTITY);

    await prisma.verification.delete({
      where: { id: verification.id },
    });
  }

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

export const signOutService = async (userId: string, refreshToken: string) => {
  const session = await prisma.session.findFirst({
    where: { userId, token: hashToken(refreshToken) },
  });

  if (!session) throw new ApiError("Session not found", StatusCodes.NOT_FOUND);

  await prisma.session.delete({
    where: { id: session.id },
  });

  return apiResponse("Sign out successful", null);
};

export const getSessionService = async (
  userId: string,
  refreshToken: string
) => {
  const session = await prisma.session.findFirst({
    where: { userId, token: hashToken(refreshToken) },
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

  if (!session) throw new ApiError("Session not found", StatusCodes.NOT_FOUND);

  return apiResponse("Session fetched successfully", {
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    },
    user: session.user,
  });
};

export const getSessionsService = async (userId: string) => {
  const sessions = await prisma.session.findMany({ where: { userId } });
  if (!sessions) throw new ApiError("No session found", StatusCodes.NOT_FOUND);
  return apiResponse("sessions fetched successfully", sessions);
};

export const revokeSessionsService = async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
  });

  if (sessions.length === 0)
    throw new ApiError("No sessions found", StatusCodes.NOT_FOUND);

  await prisma.session.deleteMany({
    where: { userId },
  });

  return apiResponse("Sessions revoked successfully", null);
};

export const revokeOtherSessionsService = async (
  userId: string,
  refreshToken: string
) => {
  const session = await prisma.session.findFirst({
    where: { userId, token: hashToken(refreshToken) },
  });

  if (!session) throw new ApiError("Session not found", StatusCodes.NOT_FOUND);

  await prisma.session.deleteMany({
    where: { userId, id: { not: session.id } },
  });

  return apiResponse("Other sessions revoked successfully", null);
};

export const enableTwoFactorService = async (
  userId: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new ApiError("User not found", StatusCodes.NOT_FOUND);

  const isPasswordValid = await bcryptCompareHashed(
    password,
    user?.password as string
  );
  if (!isPasswordValid)
    throw new ApiError("Invalid password", StatusCodes.UNPROCESSABLE_ENTITY);

  if (user.isTwoFactorEnabled)
    throw new ApiError("Two factor already enabled", StatusCodes.CONFLICT);

  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: true },
  });

  //send two factor code to user
  const twoFactorCode = generateCode();
  await prisma.verification.create({
    data: {
      identifier: userId,
      value: hashToken(twoFactorCode),
      expiresAt: new Date(Date.now() + 3 * 60 * 1000),
    },
  });

  //send email to user with two factor code
  // await sendEmail(user.email, twoFactorCode);

  return apiResponse("Two factor code successfully sent", null);
};

export const disableTwoFactorService = async (
  userId: string,
  password: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new ApiError("User not found", StatusCodes.NOT_FOUND);

  if (!user.isTwoFactorEnabled)
    throw new ApiError("Two factor not enabled", StatusCodes.BAD_REQUEST);

  const isPasswordValid = await bcryptCompareHashed(
    password,
    user?.password as string
  );
  if (!isPasswordValid)
    throw new ApiError("Invalid password", StatusCodes.UNPROCESSABLE_ENTITY);

  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: false },
  });

  return apiResponse("Two factor disabled successfully", null);
};

export const verifyTwoFactorService = async (userId: string, code: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) throw new ApiError("User not found", StatusCodes.NOT_FOUND);

  if (!user.isTwoFactorEnabled)
    throw new ApiError("Two factor not enabled", StatusCodes.BAD_REQUEST);

  const verification = await prisma.verification.findFirst({
    where: { identifier: userId, value: hashToken(code) },
  });

  if (!verification)
    throw new ApiError("Invalid code", StatusCodes.UNPROCESSABLE_ENTITY);

  if (verification.expiresAt < new Date())
    throw new ApiError("Code expired", StatusCodes.UNPROCESSABLE_ENTITY);

  await prisma.verification.delete({
    where: { id: verification.id },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: true },
  });

  return apiResponse("Two factor enabled successfully", null);
};

export const getGoogleAuthUrlService = async () => {
  const authUrl = googleOAuthClient.generateAuthUrl({
    access_type: "offline",
    scope: GOOGLE_SCOPES,
    prompt: "consent",
  });
  return apiResponse("Google authentication URL generated successfully", {
    url: authUrl,
  });
};

export const signInWithGoogleService = async (code: string, req: Request) => {
  // 1. Exchange code for Google tokens
  const { tokens } = await googleOAuthClient.getToken(code);
  googleOAuthClient.setCredentials(tokens);

  const idToken = tokens.id_token;
  const googleAccessToken = tokens.access_token;
  const googleRefreshToken = tokens.refresh_token;

  if (!idToken) {
    throw new ApiError("Invalid Google token", StatusCodes.UNAUTHORIZED);
  }

  // 2. Decode Google profile
  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new ApiError("Google payload missing", StatusCodes.BAD_REQUEST);
  }

  const { email, name, picture, sub } = payload;

  if (!email) {
    throw new ApiError("Google email missing", StatusCodes.BAD_REQUEST);
  }

  // 3. Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name ?? "Google User",
        image: picture,
        emailVerified: true,
      },
      include: { accounts: true },
    });
  }

  // 4. Link Google account
  let account = await prisma.account.findFirst({
    where: { providerId: "google", accountId: sub },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        providerId: "google",
        accountId: sub,
        userId: user?.id as string,
        accessToken: googleAccessToken ?? null,
        refreshToken: googleRefreshToken ?? null,
        idToken,
        scope: GOOGLE_SCOPES.join(" "),
      },
    });
  }

  // 5. Issue our OWN refresh token + access token
  const appRefreshToken = generateRefreshToken(user?.id as string);
  const hashedRT = hashToken(appRefreshToken);
  const session = await prisma.session.create({
    data: {
      userId: user?.id as string,
      token: hashedRT,
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

  const accessToken = generateAccessToken(user?.id as string);

  return {
    accessToken,
    refreshToken: appRefreshToken,
    session: session as any,
    user: session?.user as any,
  };
};

export const refreshGoogleAccessTokenService = async (userId: string) => {
  const account = await prisma.account.findFirst({
    where: { providerId: "google", userId },
  });

  if (!account?.refreshToken) return null;

  const client = googleOAuthClient;

  client.setCredentials({
    refresh_token: account.refreshToken,
  });

  const { credentials } = await client.refreshAccessToken();

  await prisma.account.update({
    where: { id: account.id },
    data: {
      accessToken: credentials.access_token,
      accessTokenExpiresAt: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    },
  });

  return credentials.access_token;
};

export const forgotPasswordService = async (data: ForgotPasswordSchemaType) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!existingUser) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }

  const code = generateCode();
  await prisma.verification.create({
    data: {
      expiresAt: new Date(Date.now() + 3 * 60 * 1000),
      value: hashToken(code),
      identifier: data.email,
    },
  });
  //send code to email

  return apiResponse("Code has been sent to your email account", { code });
};

export const resetPasswordService = async (data: ResetPasswordSchemaType) => {
  const existingCode = await prisma.verification.findFirst({
    where: { value: hashToken(data.code) },
  });

  if (!existingCode)
    throw new ApiError("Code not found", StatusCodes.NOT_FOUND);

  if (existingCode.expiresAt < new Date())
    throw new ApiError("Code expired", StatusCodes.UNPROCESSABLE_ENTITY);

  await prisma.verification.delete({
    where: { id: existingCode.id },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: existingCode.identifier },
  });

  if (!existingUser)
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);

  if (!existingUser.password)
    throw new ApiError("User has no password", StatusCodes.BAD_REQUEST);

  const hashedPassword = await bcryptHashed(data.password, 10);
  await prisma.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword as string },
  });

  await prisma.session.deleteMany({
    where: { userId: existingUser.id },
  });

  return apiResponse("Password reset successfully", null);
};
