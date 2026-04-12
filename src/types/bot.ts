// src/types/bot.ts
// Internal bot types: BotContext, command handler signatures, etc.

import type {
  CallbackQuery,
  Chat,
  InlineQuery,
  Message,
  TelegramUpdate,
  User,
} from "./telegram";
import type { TelegramClient } from "../services/telegram";
import type { Logger } from "../middleware/logger";

// ─── Bot Context ─────────────────────────────────────────────────────────────

/**
 * BotContext is passed to every handler. It is created fresh per request
 * from the incoming Update — no mutable global state.
 */
export interface BotContext {
  update: TelegramUpdate;
  env: Env;
  ctx: ExecutionContext;

  // Convenience shortcuts — may be undefined depending on update type
  from?: User;
  chat?: Chat;
  message?: Message;

  // Pre-constructed services (scoped to this request)
  telegram: TelegramClient;
  log: Logger;
}

// ─── Handler Signatures ───────────────────────────────────────────────────────

export type UpdateHandler = (ctx: BotContext) => Promise<void>;

export interface CommandHandler {
  command: string;
  description: string;
  handler: UpdateHandler;
  /** If true, only admins listed in ADMIN_IDS can run this command */
  adminOnly?: boolean;
}

export interface CallbackQueryHandler {
  /** Prefix or full match for callback_data */
  match: string | RegExp;
  handler: (ctx: BotContext, query: CallbackQuery) => Promise<void>;
}

// ─── Parsed Command ───────────────────────────────────────────────────────────

export interface ParsedCommand {
  command: string;
  /** Everything after the command text */
  args: string;
  /** Parsed as whitespace-split tokens */
  argv: string[];
}

/** Parse /command@BotUsername arg1 arg2 from a message entity */
export function parseCommand(
  message: Message,
  botUsername: string
): ParsedCommand | null {
  const text = message.text ?? message.caption;
  if (!text) return null;

  const entity = (message.entities ?? []).find(
    (e) => e.type === "bot_command" && e.offset === 0
  );
  if (!entity) return null;

  const rawCommand = text.slice(1, entity.length); // strip leading /
  const [commandWithMention = "", ...rest] = rawCommand.split("@");
  const mention = rawCommand.includes("@")
    ? rawCommand.split("@")[1]
    : undefined;

  // Ignore commands addressed to another bot
  if (mention && mention.toLowerCase() !== botUsername.toLowerCase()) {
    return null;
  }

  const args = text.slice(entity.length).trim();
  const argv = args.split(/\s+/).filter(Boolean);

  return { command: (commandWithMention ?? "").toLowerCase(), args, argv };
}
