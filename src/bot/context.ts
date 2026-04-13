import type { TelegramUpdate } from "../types/telegram";
import type { BotContext } from "../types/bot";
import { TelegramClient } from "../services/telegram";
import { createLogger } from "../middleware/logger";
import type { LogLevel } from "../middleware/logger";

export function buildContext(
  update: TelegramUpdate,
  env: Env,
  ctx: ExecutionContext
): BotContext {
  const from =
    update.message?.from ??
    update.edited_message?.from ??
    update.callback_query?.from ??
    update.inline_query?.from ??
    update.my_chat_member?.from ??
    update.chat_member?.from ??
    update.chat_join_request?.from;

  const chat =
    update.message?.chat ??
    update.edited_message?.chat ??
    update.callback_query?.message?.chat ??
    update.my_chat_member?.chat ??
    update.chat_member?.chat ??
    update.chat_join_request?.chat;

  const message = update.message ?? update.edited_message;

  const log = createLogger((env.LOG_LEVEL as LogLevel) ?? "info", {
    update_id: update.update_id,
    user_id: from?.id,
    chat_id: chat?.id,
  });

  const telegram = new TelegramClient(env.BOT_TOKEN);

  return {
    update,
    env,
    ctx,
    from,
    chat,
    message,
    telegram,
    log,
  };
}
