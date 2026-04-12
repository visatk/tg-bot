// src/types/telegram.ts
// Telegram Bot API types — expand as your bot grows.
// Full spec: https://core.telegram.org/bots/api

export interface TelegramUpdate {
  update_id: number;
  message?: Message;
  edited_message?: Message;
  callback_query?: CallbackQuery;
  inline_query?: InlineQuery;
  chosen_inline_result?: ChosenInlineResult;
  my_chat_member?: ChatMemberUpdated;
  chat_member?: ChatMemberUpdated;
  chat_join_request?: ChatJoinRequest;
}

export interface Message {
  message_id: number;
  from?: User;
  chat: Chat;
  date: number;
  text?: string;
  caption?: string;
  photo?: PhotoSize[];
  document?: Document;
  sticker?: Sticker;
  entities?: MessageEntity[];
  reply_to_message?: Message;
  via_bot?: User;
  forward_from?: User;
  forward_from_chat?: Chat;
}

export interface User {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface Chat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface CallbackQuery {
  id: string;
  from: User;
  message?: Message;
  inline_message_id?: string;
  data?: string;
  game_short_name?: string;
}

export interface InlineQuery {
  id: string;
  from: User;
  query: string;
  offset: string;
  chat_type?: string;
  location?: Location;
}

export interface ChosenInlineResult {
  result_id: string;
  from: User;
  query: string;
  inline_message_id?: string;
}

export interface ChatMemberUpdated {
  chat: Chat;
  from: User;
  date: number;
  old_chat_member: ChatMember;
  new_chat_member: ChatMember;
}

export interface ChatJoinRequest {
  chat: Chat;
  from: User;
  user_chat_id: number;
  date: number;
}

export interface ChatMember {
  status: string;
  user: User;
}

export interface MessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: User;
}

export interface PhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface Document {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface Sticker {
  file_id: string;
  file_unique_id: string;
  type: string;
  width: number;
  height: number;
  is_animated: boolean;
  is_video: boolean;
}

export interface Location {
  longitude: number;
  latitude: number;
}

// ─── Keyboard types ──────────────────────────────────────────────────────────

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  switch_inline_query?: string;
  switch_inline_query_current_chat?: string;
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  input_field_placeholder?: string;
  is_persistent?: boolean;
}

export interface KeyboardButton {
  text: string;
  request_contact?: boolean;
  request_location?: boolean;
}

export type ReplyMarkup =
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | { remove_keyboard: true }
  | { force_reply: true; input_field_placeholder?: string };

// ─── API request/response types ───────────────────────────────────────────────

export interface SendMessageParams {
  chat_id: number | string;
  text: string;
  parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
  reply_markup?: ReplyMarkup;
  reply_to_message_id?: number;
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  message_thread_id?: number;
}

export interface EditMessageTextParams {
  chat_id?: number | string;
  message_id?: number;
  inline_message_id?: string;
  text: string;
  parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
}

export interface AnswerCallbackQueryParams {
  callback_query_id: string;
  text?: string;
  show_alert?: boolean;
  url?: string;
  cache_time?: number;
}

export interface AnswerInlineQueryParams {
  inline_query_id: string;
  results: InlineQueryResult[];
  cache_time?: number;
  is_personal?: boolean;
  next_offset?: string;
}

export type InlineQueryResult =
  | InlineQueryResultArticle
  | InlineQueryResultPhoto;

export interface InlineQueryResultArticle {
  type: "article";
  id: string;
  title: string;
  input_message_content: InputMessageContent;
  description?: string;
  reply_markup?: InlineKeyboardMarkup;
}

export interface InlineQueryResultPhoto {
  type: "photo";
  id: string;
  photo_url: string;
  thumbnail_url: string;
  title?: string;
  caption?: string;
  parse_mode?: "HTML" | "MarkdownV2";
  reply_markup?: InlineKeyboardMarkup;
}

export interface InputMessageContent {
  message_text: string;
  parse_mode?: "HTML" | "MarkdownV2";
}

export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}
