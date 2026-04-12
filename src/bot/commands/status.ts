// src/bot/commands/status.ts

import type { CommandHandler } from "../../types/bot";
import { UserService } from "../../services/user";
import { bold, code } from "../../utils/format";

export const statusCommand: CommandHandler = {
  command: "status",
  description: "Bot health and stats (admin only)",
  adminOnly: true,
  async handler(ctx) {
    const userSvc = new UserService(ctx.env.DB);
    const totalUsers = await userSvc.count();

    const lines = [
      `${bold("🤖 Bot Status")}`,
      "",
      `Users: ${code(String(totalUsers))}`,
      `Uptime: ${code("OK ✅")}`,
      `Region: ${code(ctx.env.CF_REGION ?? "unknown")}`,
    ];

    await ctx.telegram.sendMessage({
      chat_id: ctx.chat!.id,
      parse_mode: "HTML",
      text: lines.join("\n"),
    });
  },
};
