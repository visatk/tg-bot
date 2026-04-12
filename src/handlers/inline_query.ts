// src/handlers/inline_query.ts
// Handles @BotMention queries in any chat.

import type { BotContext } from "../types/bot";
import type { InlineQueryResult } from "../types/telegram";

export async function handleInlineQuery(ctx: BotContext): Promise<void> {
  const query = ctx.update.inline_query;
  if (!query) return;

  const q = query.query.trim().toLowerCase();
  ctx.log.info("inline_query received", { query: q, from: query.from.id });

  // Build results — replace with your real search logic
  const results: InlineQueryResult[] = [
    {
      type: "article",
      id: "result-1",
      title: q ? `Search: ${q}` : "Start typing to search…",
      input_message_content: {
        message_text: q
          ? `🔍 <b>Search result for:</b> ${q}\n\nNo results yet — add your logic in <code>src/handlers/inline_query.ts</code>.`
          : "Use me inline to search!",
        parse_mode: "HTML",
      },
      description: "Click to send",
    },
  ];

  await ctx.telegram.answerInlineQuery({
    inline_query_id: query.id,
    results,
    cache_time: 10,
    is_personal: true,
  });
}
