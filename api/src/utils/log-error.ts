export async function logError(
  error: Error,
  context: Record<string, any> = {}
) {
  const log = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : "hidden",
    context,
  };

  if (process.env.NODE_ENV === "development") {
    console.error("[ERROR]", log);
    return;
  }

  const shouldNotify = !context.isOperational || context.statusCode >= 500;

  if (shouldNotify && process.env.ERROR_WEBHOOK_URL) {
    await fetch(process.env.ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[PROD ERROR]\\n${JSON.stringify(log, null, 2)}`,
      }),
    });
  }
}
