import type { MiddlewareHandler } from "hono";

// Telegram's official IP ranges (update if Telegram publishes changes)
// https://core.telegram.org/resources/cidr.txt
const TELEGRAM_IP_RANGES = [
  "149.154.160.0/20",
  "91.108.4.0/22",
];

/**
 * Hono middleware that authenticates webhook calls from Telegram.
 * Mount BEFORE any route that processes updates.
 */
export function webhookAuth(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const secret = c.env.WEBHOOK_SECRET;
    const incoming = c.req.header("x-telegram-bot-api-secret-token") ?? "";

    // Constant-time comparison — prevents timing side-channel attacks
    const isValid = await timingSafeEqual(incoming, secret);
    if (!isValid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  };
}

/**
 * Compare two strings in constant time.
 * Hashes both to SHA-256 first so length differences don't leak.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(hashA, hashB);
}

/**
 * Parse a CIDR block and check whether an IP falls within it.
 * IPv4 only — sufficient for Telegram's current infrastructure.
 */
function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  if (!range || !bits) return false;
  const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1);
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

function ipToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) | parseInt(octet), 0);
}

/** Returns true if the IP belongs to a known Telegram server range. */
export function isTelegramIp(ip: string): boolean {
  return TELEGRAM_IP_RANGES.some((cidr) => ipInCidr(ip, cidr));
}
