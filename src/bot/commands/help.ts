// src/bot/commands/help.ts

import type { CommandHandler } from "../../types/bot";
import { bold, italic } from "../../utils/format";

export const helpCommand: CommandHandler = {
  command: "help",
  description: "Show all available commands",
  async handler(ctx) {
    const lines = [
      `${bold("📋 Available Commands")}`,
      "",
      "/start — Welcome message & quick actions",
      "/help — Show this help message",
      "/settings — Your preferences",
      "/status — Bot status & stats",
      "",
      italic("More commands coming soon..."),
    ];

    await ctx.telegram.sendMessage({
      chat_id: ctx.chat!.id,
      parse_mode: "HTML",
      text: lines.join("\n"),
    });
  },
};
