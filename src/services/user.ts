// src/services/user.ts
// D1-backed user management. Upsert on every update, read as needed.

export interface BotUser {
  id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
  is_premium: number; // D1 stores booleans as 0/1
  created_at: string;
  updated_at: string;
}

export class UserService {
  constructor(private readonly db: D1Database) {}

  /**
   * Upsert a user record from a Telegram User object.
   * Safe to call on every incoming update — idempotent.
   */
  async upsert(user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO users (id, first_name, last_name, username, language_code, is_premium, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           first_name    = excluded.first_name,
           last_name     = excluded.last_name,
           username      = excluded.username,
           language_code = excluded.language_code,
           is_premium    = excluded.is_premium,
           updated_at    = CURRENT_TIMESTAMP`
      )
      .bind(
        user.id,
        user.first_name,
        user.last_name ?? null,
        user.username ?? null,
        user.language_code ?? null,
        user.is_premium ? 1 : 0
      )
      .run();
  }

  async findById(userId: number): Promise<BotUser | null> {
    const result = await this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(userId)
      .first<BotUser>();
    return result ?? null;
  }

  async count(): Promise<number> {
    const result = await this.db
      .prepare("SELECT COUNT(*) as cnt FROM users")
      .first<{ cnt: number }>();
    return result?.cnt ?? 0;
  }
}
