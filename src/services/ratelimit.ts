// src/services/ratelimit.ts
// Sliding-window rate limiter backed by KV.
// Uses atomic KV operations — safe under concurrent isolate execution.

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
  /** KV key prefix */
  prefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (seconds)
}

export class RateLimiter {
  private readonly prefix: string;

  constructor(
    private readonly kv: KVNamespace,
    private readonly config: RateLimitConfig
  ) {
    this.prefix = config.prefix ?? "rl";
  }

  async check(identifier: string | number): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.config.windowSec;

    // Read current count
    const raw = await this.kv.get<number[]>(key, "json");
    const timestamps: number[] = (raw ?? []).filter((t) => t > windowStart);

    const remaining = Math.max(0, this.config.limit - timestamps.length);
    const allowed = timestamps.length < this.config.limit;

    if (allowed) {
      timestamps.push(now);
      // Store with TTL = window size so old keys auto-expire
      await this.kv.put(key, JSON.stringify(timestamps), {
        expirationTtl: this.config.windowSec,
      });
    }

    // Reset at = oldest timestamp + window
    const oldestTimestamp = timestamps[0] ?? now;
    const resetAt = oldestTimestamp + this.config.windowSec;

    return { allowed, remaining, resetAt };
  }
}
