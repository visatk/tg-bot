// src/handlers/message.ts
// Handles plain text messages that are not commands.
// Add conversational logic, state machines, or AI calls here.

import type { BotContext } from "../types/bot";

export async function handleMessage(ctx: BotContext): Promise<void> {
  const message = ctx.message;
  if (!message) return;

  const text = (message.text ?? message.caption ?? "").trim();

  // Ignore empty messages (photos with no caption, stickers, etc.)
  if (!text) return;

  ctx.log.info("plain message received", {
    chat_id: message.chat.id,
    length: text.length,
  });

  // ── Add your conversational logic here ───────────────────────────────────
  // Examples:
  //   • State-machine: read user state from KV, respond accordingly
  //   • AI: call Workers AI or an LLM API
  //   • Echo: just mirror the message back for testing

  // Default: echo the message back (replace with real logic)
  await ctx.telegram.sendMessage({
    chat_id: message.chat.id,
    text: `You said: ${text}`,
    reply_to_message_id: message.message_id,
  });
}
