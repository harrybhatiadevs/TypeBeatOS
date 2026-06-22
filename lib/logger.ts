import pino, { type Logger } from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * App-wide logger. Pretty + colourful in dev; JSON in production
 * (so the host's log shipper / Sentry / Datadog can ingest it directly).
 *
 * The redact list covers every secret we currently read from `.env` or
 * persist on a Session / YouTubeAccount row. Anything new that holds a
 * secret should be added here, not just hidden by convention.
 */
export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  base: { service: "typebeatos" },
  redact: {
    paths: [
      "password",
      "passwordHash",
      "accessToken",
      "refreshToken",
      "token",
      "secret",
      "*.password",
      "*.passwordHash",
      "*.accessToken",
      "*.refreshToken",
      "*.token",
      "*.secret",
      'req.headers["cookie"]',
      'req.headers["authorization"]',
      'res.headers["set-cookie"]',
    ],
    censor: "[REDACTED]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname,service" },
        },
      }
    : {}),
});

/** Child logger bound to a module name and optional extra context. */
export function loggerFor(module: string, extra?: Record<string, unknown>): Logger {
  return logger.child({ module, ...(extra ?? {}) });
}
