// src/bot/router.ts
// Central update dispatcher. Receives a BotContext and routes it to the
// correct handler based on the update type and content.
//
// Responsibilities:
//   • Command dispatch (with admin guard)
//   • Per-user rate limiting (backed by KV)
//   • User upsert into D1 (via ctx.waitUntil — non-blocking)
//   • Routing to message / callback_query / inline_query handlers

import type { BotContext } from "../types/bot";
import { parseCommand } from "../types/bot";
import { COMMAND_MAP } from "./commands";
import { handleMessage } from "../handlers/message";
import { handleCallbackQuery } from "../handlers/callback_query";
import { handleInlineQuery } from "../handlers/inline_query";
import { UserService } from "../services/user";
import { RateLimiter } from "../services/ratelimit";

// ─── Rate limiter config ──────────────────────────────────────────────────────
// 30 updates per 60-second window per user. Adjust as needed.
const USER_RATE_LIMIT = { limit: 30, windowSec: 60, prefix: "rl:user" };

// ─── Main router ─────────────────────────────────────────────────────────────

export async function routeUpdate(ctx: BotContext): Promise<void> {
  const { update, env, ctx: execCtx } = ctx;

  // ── 1. Upsert user in background (non-blocking) ───────────────────────────
  if (ctx.from && !ctx.from.is_bot) {
    const userSvc = new UserService(env.DB);
    execCtx.waitUntil(userSvc.upsert(ctx.from));
  }

  // ── 2. Rate limit per user ────────────────────────────────────────────────
  if (ctx.from) {
    const limiter = new RateLimiter(env.KV_CACHE, USER_RATE_LIMIT);
    const result = await limiter.check(ctx.from.id);
    if (!result.allowed) {
      ctx.log.warn("rate limit exceeded", { user_id: ctx.from.id });
      if (ctx.chat) {
        await ctx.telegram.sendMessage({
          chat_id: ctx.chat.id,
          text: "⚠️ Slow down! Please wait a moment before sending more messages.",
        });
      }
      return;
    }
  }

  // ── 3. Route by update type ───────────────────────────────────────────────

  // Callback query (inline keyboard button press)
  if (update.callback_query) {
    await handleCallbackQuery(ctx);
    return;
  }

  // Inline query (@BotName mention in any chat)
  if (update.inline_query) {
    await handleInlineQuery(ctx);
    return;
  }

  // Message or edited_message
  const message = update.message ?? update.edited_message;
  if (message) {
    const parsed = parseCommand(message, env.BOT_USERNAME);

    if (parsed) {
      // ── Command dispatch ───────────────────────────────────────────────────
      const handler = COMMAND_MAP.get(parsed.command);

      if (!handler) {
        ctx.log.info("unknown command", { command: parsed.command });
        return;
      }

      // Admin guard
      if (handler.adminOnly) {
        const adminIds = parseAdminIds(env.ADMIN_IDS);
        if (!ctx.from || !adminIds.includes(ctx.from.id)) {
          await ctx.telegram.sendMessage({
            chat_id: message.chat.id,
            text: "🚫 You don't have permission to use this command.",
          });
          return;
        }
      }

      ctx.log.info("command dispatched", {
        command: parsed.command,
        user_id: ctx.from?.id,
      });

      await handler.handler(ctx);
      return;
    }

    // Non-command message
    await handleMessage(ctx);
    return;
  }

  // Member status changes — bot added/removed/blocked
  if (update.my_chat_member) {
    const { new_chat_member } = update.my_chat_member;
    ctx.log.info("my_chat_member update", {
      status: new_chat_member.status,
      chat_id: update.my_chat_member.chat.id,
    });
    // Handle bot being kicked, banned, restricted, etc.
    return;
  }

  ctx.log.debug("unhandled update type", {
    update_id: update.update_id,
    keys: Object.keys(update).filter((k) => k !== "update_id"),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAdminIds(raw: string): number[] {
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
}
