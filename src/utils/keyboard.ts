// src/utils/keyboard.ts
// Fluent builders for Telegram inline and reply keyboards.

import type {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  KeyboardButton,
  ReplyKeyboardMarkup,
} from "../types/telegram";

// ─── Inline Keyboard ──────────────────────────────────────────────────────────

export class InlineKeyboard {
  private rows: InlineKeyboardButton[][] = [];
  private currentRow: InlineKeyboardButton[] = [];

  /** Add a callback button to the current row. */
  button(text: string, callbackData: string): this {
    this.currentRow.push({ text, callback_data: callbackData });
    return this;
  }

  /** Add a URL button to the current row. */
  url(text: string, url: string): this {
    this.currentRow.push({ text, url });
    return this;
  }

  /** Add a switch-inline button to the current row. */
  switchInline(text: string, query = ""): this {
    this.currentRow.push({ text, switch_inline_query: query });
    return this;
  }

  /** Break to the next row. */
  row(): this {
    if (this.currentRow.length > 0) {
      this.rows.push([...this.currentRow]);
      this.currentRow = [];
    }
    return this;
  }

  build(): InlineKeyboardMarkup {
    const rows = [...this.rows];
    if (this.currentRow.length > 0) {
      rows.push([...this.currentRow]);
    }
    return { inline_keyboard: rows };
  }
}

// ─── Reply Keyboard ───────────────────────────────────────────────────────────

export class ReplyKeyboard {
  private rows: KeyboardButton[][] = [];
  private currentRow: KeyboardButton[] = [];
  private opts: Partial<Omit<ReplyKeyboardMarkup, "keyboard">> = {
    resize_keyboard: true,
  };

  button(text: string): this {
    this.currentRow.push({ text });
    return this;
  }

  contactButton(text: string): this {
    this.currentRow.push({ text, request_contact: true });
    return this;
  }

  locationButton(text: string): this {
    this.currentRow.push({ text, request_location: true });
    return this;
  }

  row(): this {
    if (this.currentRow.length > 0) {
      this.rows.push([...this.currentRow]);
      this.currentRow = [];
    }
    return this;
  }

  oneTime(): this {
    this.opts.one_time_keyboard = true;
    return this;
  }

  placeholder(text: string): this {
    this.opts.input_field_placeholder = text;
    return this;
  }

  build(): ReplyKeyboardMarkup {
    const rows = [...this.rows];
    if (this.currentRow.length > 0) {
      rows.push([...this.currentRow]);
    }
    return { keyboard: rows, ...this.opts };
  }
}

// ─── Quick helpers ────────────────────────────────────────────────────────────

export const removeKeyboard = (): { remove_keyboard: true } => ({
  remove_keyboard: true,
});

/** Build a simple 1-row inline keyboard from label→data pairs */
export function simpleInline(
  buttons: Array<{ text: string; data: string }>
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      buttons.map(({ text, data }) => ({ text, callback_data: data })),
    ],
  };
}
