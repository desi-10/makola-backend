import pino from "pino";
import pinoHttpModule from "pino-http";

const pinoHttp = (pinoHttpModule as any).default || pinoHttpModule;

export const logger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
            singleLine: true,
          },
        }
      : undefined,
});

export const httpLogger = pinoHttp({
  logger,
  quietReqLogger: true,
  autoLogging: process.env.NODE_ENV !== "production",
});
