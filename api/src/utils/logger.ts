import pino from "pino";
import pinoHttpModule from "pino-http";
import { env } from "./env.js";

const pinoHttp = (pinoHttpModule as any).default || pinoHttpModule;

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  transport:
    env.NODE_ENV === "development"
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
  quietReqLogger: false,
  // autoLogging: env.NODE_ENV !== "production" ,
  autoLogging: false,
});
