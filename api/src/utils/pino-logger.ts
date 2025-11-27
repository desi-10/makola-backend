// import { logger } from "./logger.js";
import { Request } from "express";
import { logger } from "./logger.js";
interface ErrorContext {
  method?: string;
  path?: string;
  statusCode?: number;
  isOperational?: boolean;
  [key: string]: any;
}

export async function logError(
  //   req: Request,
  error: Error,
  context: ErrorContext = {}
): Promise<void> {
  const isDev = process.env.NODE_ENV === "development";
  const isOperational = context.isOperational ?? false;
  const statusCode = context.statusCode ?? 500;

  // ✅ Only send alerts in production (not console log again)
  if (isDev) return;

  const shouldNotify = !isOperational || statusCode >= 500;
  if (!shouldNotify || !process.env.ERROR_WEBHOOK_URL) return;

  const log = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
  };

  try {
    await fetch(process.env.ERROR_WEBHOOK_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[🔥 PROD ERROR ALERT]\n${JSON.stringify(log, null, 2)}`,
      }),
    });
  } catch (notifyError) {
    logger.error({ err: notifyError }, "Failed to send error webhook");
    // req.log.error({ err: notifyError }, "Failed to send error webhook");
  }
}
