// src/bot/commands/start.ts

import type { CommandHandler } from "../../types/bot";
import { bold } from "../../utils/format";
import { InlineKeyboard } from "../../utils/keyboard";

export const startCommand: CommandHandler = {
  command: "start",
  description: "Start the bot and get a welcome message",
  async handler(ctx) {
    const name = ctx.from?.first_name ?? "there";

    const keyboard = new InlineKeyboard()
      .button("📖 Help", "help")
      .button("⚙️ Settings", "settings")
      .row()
      .button("🌐 Website", "website")
      .build();

    await ctx.telegram.sendMessage({
      chat_id: ctx.chat!.id,
      parse_mode: "HTML",
      text: [
        `Hey ${bold(name)}! 👋`,
        "",
        "Welcome to <b>MyAwesomeBot</b>. Here's what I can do:",
        "",
        "• /help — see all commands",
        "• /settings — configure your preferences",
        "",
        "Let's get started!",
      ].join("\n"),
      reply_markup: keyboard,
    });
  },
};
