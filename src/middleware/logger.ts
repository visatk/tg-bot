// src/middleware/logger.ts
// Structured JSON logger. Use console.log/warn/error so Workers Observability
// assigns the correct severity level in the dashboard.

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createLogger(
  minLevel: LogLevel = "info",
  baseFields: Record<string, unknown> = {}
): Logger {
  const minRank = LEVEL_RANK[minLevel];

  function log(
    level: LogLevel,
    fn: typeof console.log,
    msg: string,
    meta?: Record<string, unknown>
  ): void {
    if (LEVEL_RANK[level] < minRank) return;
    fn(
      JSON.stringify({
        level,
        msg,
        ts: new Date().toISOString(),
        ...baseFields,
        ...meta,
      })
    );
  }

  return {
    debug: (msg, meta) => log("debug", console.debug, msg, meta),
    info:  (msg, meta) => log("info",  console.log,   msg, meta),
    warn:  (msg, meta) => log("warn",  console.warn,  msg, meta),
    error: (msg, meta) => log("error", console.error, msg, meta),
  };
}
