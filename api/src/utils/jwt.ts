import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js"; // adjust path if needed
import { StatusCodes } from "http-status-codes";

// 🧩 Environment Variables
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "change-me-access";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "change-me-refresh";
const ACCESS_JWT_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN ||
  "15m") as SignOptions["expiresIn"];
const REFRESH_JWT_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ||
  "7d") as SignOptions["expiresIn"];

// 🔑 Generate Access Token
export function generateAccessToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_JWT_EXPIRES_IN,
  });
}

// 🔑 Generate Refresh Token
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_JWT_EXPIRES_IN,
  });
}

// 🔍 Verify Access Token
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError("Access token expired", StatusCodes.UNAUTHORIZED);
    }
    throw new ApiError("Invalid access token", StatusCodes.UNAUTHORIZED);
  }
}

// 🔍 Verify Refresh Token
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError("Refresh token expired", StatusCodes.UNAUTHORIZED);
    }
    throw new ApiError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
  }
}
