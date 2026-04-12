// src/utils/format.ts
// Telegram HTML parse_mode helpers. Always prefer HTML over MarkdownV2 —
// MarkdownV2 requires escaping many common characters and is error-prone.

/** Escape special HTML characters for safe use in Telegram HTML messages. */
export function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const bold = (text: string) => `<b>${escape(text)}</b>`;
export const italic = (text: string) => `<i>${escape(text)}</i>`;
export const code = (text: string) => `<code>${escape(text)}</code>`;
export const pre = (text: string, lang = "") =>
  lang ? `<pre><code class="language-${lang}">${escape(text)}</code></pre>`
       : `<pre>${escape(text)}</pre>`;
export const link = (text: string, url: string) =>
  `<a href="${url}">${escape(text)}</a>`;
export const underline = (text: string) => `<u>${escape(text)}</u>`;
export const strike = (text: string) => `<s>${escape(text)}</s>`;
export const spoiler = (text: string) =>
  `<tg-spoiler>${escape(text)}</tg-spoiler>`;

/** Mention a user by their Telegram ID (works even without a username). */
export const mentionById = (name: string, userId: number) =>
  `<a href="tg://user?id=${userId}">${escape(name)}</a>`;

/** Format a Unix timestamp as a human-readable UTC date string. */
export function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toUTCString();
}

/** Truncate text to maxLength, appending an ellipsis if needed. */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}
