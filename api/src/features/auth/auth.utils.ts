import { Response } from "express";

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
