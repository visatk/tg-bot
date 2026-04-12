// src/services/telegram.ts
// Type-safe Telegram Bot API client. Uses native fetch — no SDK needed.

import type {
  AnswerCallbackQueryParams,
  AnswerInlineQueryParams,
  EditMessageTextParams,
  Message,
  SendMessageParams,
  TelegramApiResponse,
} from "../types/telegram";

const TELEGRAM_API_BASE = "https://api.telegram.org";

export class TelegramClient {
  private readonly apiBase: string;

  constructor(token: string) {
    this.apiBase = `${TELEGRAM_API_BASE}/bot${token}`;
  }

  // ─── Core request method ────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.apiBase}/${method}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: params ? JSON.stringify(params) : undefined,
    });

    if (!response.ok) {
      throw new TelegramApiError(
        `HTTP ${response.status} calling ${method}`,
        response.status
      );
    }

    const data = await response.json<TelegramApiResponse<T>>();
    if (!data.ok) {
      throw new TelegramApiError(
        data.description ?? `Telegram error in ${method}`,
        data.error_code ?? 0
      );
    }

    return data.result as T;
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  async sendMessage(params: SendMessageParams): Promise<Message> {
    return this.request<Message>("sendMessage", params as Record<string, unknown>);
  }

  async editMessageText(params: EditMessageTextParams): Promise<Message | true> {
    return this.request<Message | true>(
      "editMessageText",
      params as Record<string, unknown>
    );
  }

  async deleteMessage(chatId: number | string, messageId: number): Promise<true> {
    return this.request<true>("deleteMessage", {
      chat_id: chatId,
      message_id: messageId,
    });
  }

  async sendChatAction(
    chatId: number | string,
    action:
      | "typing"
      | "upload_photo"
      | "record_video"
      | "upload_video"
      | "record_voice"
      | "upload_voice"
      | "upload_document"
      | "choose_sticker"
      | "find_location"
  ): Promise<true> {
    return this.request<true>("sendChatAction", {
      chat_id: chatId,
      action,
    });
  }

  // ─── Callback queries ────────────────────────────────────────────────────────

  async answerCallbackQuery(params: AnswerCallbackQueryParams): Promise<true> {
    return this.request<true>(
      "answerCallbackQuery",
      params as Record<string, unknown>
    );
  }

  // ─── Inline queries ──────────────────────────────────────────────────────────

  async answerInlineQuery(params: AnswerInlineQueryParams): Promise<true> {
    return this.request<true>(
      "answerInlineQuery",
      params as Record<string, unknown>
    );
  }

  // ─── Webhook ─────────────────────────────────────────────────────────────────

  async setWebhook(url: string, secretToken: string): Promise<true> {
    return this.request<true>("setWebhook", {
      url,
      secret_token: secretToken,
      allowed_updates: [
        "message",
        "edited_message",
        "callback_query",
        "inline_query",
        "my_chat_member",
        "chat_member",
        "chat_join_request",
      ],
      drop_pending_updates: true,
    });
  }

  async deleteWebhook(): Promise<true> {
    return this.request<true>("deleteWebhook");
  }

  async getMe(): Promise<{ id: number; username: string; first_name: string }> {
    return this.request("getMe");
  }
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class TelegramApiError extends Error {
  constructor(
    message: string,
    public readonly code: number
  ) {
    super(message);
    this.name = "TelegramApiError";
  }

  /** True if the message/chat was deleted or bot was blocked */
  get isGone(): boolean {
    return this.code === 400 || this.code === 403;
  }

  /** True if we're being rate-limited by Telegram */
  get isRateLimited(): boolean {
    return this.code === 429;
  }
}
