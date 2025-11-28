import { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const setRefreshToken = (res: Response, refreshToken: string) => {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

export const clearRefreshToken = (res: Response) => {
  res.clearCookie("refresh_token");
};

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const bcryptHashed = async (password: string, salt: number) => {
  const hashed = await bcrypt.hash(password, salt);
  return hashed;
};

export const bcryptCompareHashed = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};
