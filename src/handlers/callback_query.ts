// src/handlers/callback_query.ts
// Dispatches inline keyboard button presses (callback_query updates).
// Add cases to the CALLBACK_HANDLERS map below.

import type { BotContext } from "../types/bot";
import type { CallbackQuery } from "../types/telegram";

// ─── Handler map ─────────────────────────────────────────────────────────────
// Key = exact callback_data string OR a prefix ending with ":"
// For prefix matching, the handler receives the full data string.

type CbHandler = (ctx: BotContext, query: CallbackQuery, data: string) => Promise<void>;

const CALLBACK_HANDLERS: Map<string | RegExp, CbHandler> = new Map([
  ["help",     handleHelp],
  ["settings", handleSettings],
  ["website",  handleWebsite],
  // Prefix example: handles "action:123", "action:456", etc.
  [/^action:/, handleAction],
]);

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function handleCallbackQuery(ctx: BotContext): Promise<void> {
  const query = ctx.update.callback_query;
  if (!query) return;

  const data = query.data ?? "";

  // Find the matching handler
  let handler: CbHandler | undefined;
  for (const [key, fn] of CALLBACK_HANDLERS) {
    if (typeof key === "string" ? key === data : key.test(data)) {
      handler = fn;
      break;
    }
  }

  if (!handler) {
    ctx.log.warn("Unhandled callback_query", { data });
    await ctx.telegram.answerCallbackQuery({
      callback_query_id: query.id,
      text: "⚠️ Unknown action.",
      show_alert: false,
    });
    return;
  }

  await handler(ctx, query, data);
}

// ─── Individual handlers ──────────────────────────────────────────────────────

async function handleHelp(ctx: BotContext, query: CallbackQuery): Promise<void> {
  await ctx.telegram.answerCallbackQuery({ callback_query_id: query.id });
  await ctx.telegram.sendMessage({
    chat_id: query.from.id,
    parse_mode: "HTML",
    text: "<b>Help</b>\n\nUse /help to see all commands.",
  });
}

async function handleSettings(ctx: BotContext, query: CallbackQuery): Promise<void> {
  await ctx.telegram.answerCallbackQuery({ callback_query_id: query.id });
  await ctx.telegram.sendMessage({
    chat_id: query.from.id,
    parse_mode: "HTML",
    text: "⚙️ <b>Settings</b>\n\nComing soon!",
  });
}

async function handleWebsite(ctx: BotContext, query: CallbackQuery): Promise<void> {
  await ctx.telegram.answerCallbackQuery({
    callback_query_id: query.id,
    text: "Opening website...",
  });
}

async function handleAction(
  ctx: BotContext,
  query: CallbackQuery,
  data: string
): Promise<void> {
  const [, id] = data.split(":");
  await ctx.telegram.answerCallbackQuery({
    callback_query_id: query.id,
    text: `Action: ${id}`,
  });
}
