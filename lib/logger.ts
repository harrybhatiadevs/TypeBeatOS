import pino, { type Logger } from "pino";

const isDev = process.env.NODE_ENV !== "production";

const REDACT = {
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
};

/**
 * App-wide logger. Pretty + colourful in dev; JSON in production
 * (so the host's log shipper / Sentry / Datadog can ingest it directly).
 *
 * Dev uses pino-pretty as a direct destination stream rather than a
 * worker transport — the worker thread crashes intermittently under
 * Next.js dev HMR, taking the whole logger down with it.
 */
function buildLogger(): Logger {
  const level = process.env.LOG_LEVEL || (isDev ? "debug" : "info");
  const base = { service: "typebeatos" };

  if (isDev) {
    // require() rather than import — keeps pino-pretty out of the
    // production bundle and avoids the worker-transport quirk under HMR.

    const pretty = require("pino-pretty");
    const stream = pretty({
      colorize: true,
      translateTime: "HH:MM:ss.l",
      ignore: "pid,hostname,service",
      sync: true,
    });
    return pino({ level, base, redact: REDACT }, stream);
  }
  return pino({ level, base, redact: REDACT });
}

export const logger: Logger = buildLogger();

/** Child logger bound to a module name and optional extra context. */
export function loggerFor(module: string, extra?: Record<string, unknown>): Logger {
  return logger.child({ module, ...(extra ?? {}) });
}
