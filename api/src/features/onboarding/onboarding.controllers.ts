import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as onboardingServices from "./onboarding.services.js";

export const completeOnboarding = async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const result = await onboardingServices.completeOnboardingService(
    userId,
    req.body,
    req.ip as string,
    (req.headers["user-agent"] as string) || ""
  );
  return res.status(StatusCodes.OK).json(result);
};
