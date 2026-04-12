# tg-bot · Cloudflare Workers Telegram Bot

Production-grade Telegram bot starter template for Cloudflare Workers.
Built with TypeScript, Hono, D1, KV, and Queues — following official Workers best practices.

---

## Architecture

```
src/
├── index.ts                  # Worker entry point (fetch + queue + scheduled)
├── types/
│   ├── telegram.ts           # Telegram Bot API types
│   └── bot.ts                # BotContext, handler signatures, parseCommand
├── bot/
│   ├── context.ts            # BotContext factory (pure, no I/O)
│   ├── router.ts             # Central update dispatcher + rate limiter
│   └── commands/
│       ├── index.ts          # Command registry (Map)
│       ├── start.ts          # /start
│       ├── help.ts           # /help
│       └── status.ts         # /status (admin-only)
├── handlers/
│   ├── message.ts            # Plain text / non-command messages
│   ├── callback_query.ts     # Inline keyboard button presses
│   └── inline_query.ts       # @BotMention inline search
├── services/
│   ├── telegram.ts           # Telegram Bot API client (typed fetch wrapper)
│   ├── user.ts               # D1-backed user upsert / lookup
│   └── ratelimit.ts          # KV sliding-window rate limiter
├── middleware/
│   ├── webhook-auth.ts       # Constant-time secret verification (timingSafeEqual)
│   └── logger.ts             # Structured JSON logger
└── utils/
    ├── keyboard.ts           # Fluent InlineKeyboard / ReplyKeyboard builders
    └── format.ts             # HTML escape + bold/italic/code helpers
```

### Infrastructure Bindings

| Binding       | Purpose                                          |
|---------------|--------------------------------------------------|
| `DB` (D1)     | User records, settings, event audit log          |
| `KV_CACHE`    | Rate limiter windows, short-lived caches         |
| `EVENT_QUEUE` | Background tasks: analytics, notifications, etc. |

---

## Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd tg-bot
npm install
```

### 2. Create Cloudflare resources

```bash
# KV namespace
wrangler kv namespace create KV_CACHE
# → copy the id into wrangler.jsonc > kv_namespaces[0].id

# D1 database
wrangler d1 create tg-bot-db
# → copy the database_id into wrangler.jsonc > d1_databases[0].database_id

# Queue
wrangler queues create tg-bot-events

# Run migrations
wrangler d1 migrations apply tg-bot-db
```

### 3. Set secrets

```bash
wrangler secret put BOT_TOKEN         # from @BotFather
wrangler secret put WEBHOOK_SECRET    # any random string, 1–256 chars
wrangler secret put ADMIN_IDS         # comma-separated Telegram user IDs
```

For local dev, copy `.dev.vars.example` → `.dev.vars` and fill in values.

### 4. Generate TypeScript types

```bash
npm run types   # runs wrangler types → updates worker-configuration.d.ts
```

### 5. Develop locally

```bash
npm run dev     # wrangler dev — live reload, local bindings
```

### 6. Deploy

```bash
npm run deploy              # deploy to workers.dev
npm run deploy:production   # deploy to production environment
```

### 7. Register the webhook

After deploying, call the setup endpoint once:

```bash
curl -X POST "https://tg-bot.<your-subdomain>.workers.dev/setup?secret=<WEBHOOK_SECRET>"
```

This calls `setWebhook` on Telegram's API, pointing to your Worker's `/webhook` route.

---

## Adding Commands

1. Create `src/bot/commands/my-command.ts`:

```typescript
import type { CommandHandler } from "../../types/bot";

export const myCommand: CommandHandler = {
  command: "mycommand",
  description: "Does something awesome",
  async handler(ctx) {
    await ctx.telegram.sendMessage({
      chat_id: ctx.chat!.id,
      text: "Hello from myCommand!",
    });
  },
};
```

2. Register it in `src/bot/commands/index.ts`:

```typescript
import { myCommand } from "./my-command";
export const COMMANDS: CommandHandler[] = [
  startCommand,
  helpCommand,
  statusCommand,
  myCommand, // ← add here
];
```

Done. The router dispatches it automatically.

---

## Adding Callback Handlers

In `src/handlers/callback_query.ts`, add to `CALLBACK_HANDLERS`:

```typescript
["my_action", handleMyAction],          // exact match
[/^paginate:/, handlePaginate],         // regex prefix
```

Then implement the function:

```typescript
async function handleMyAction(ctx: BotContext, query: CallbackQuery): Promise<void> {
  await ctx.telegram.answerCallbackQuery({ callback_query_id: query.id });
  // your logic
}
```

---

## Background Work (Queues)

Send a job from any handler:

```typescript
await ctx.env.EVENT_QUEUE.send({
  type: "notification",
  payload: { userId: ctx.from!.id, message: "Hello!" },
  timestamp: Date.now(),
});
```

Process it in `src/index.ts` → `processQueueMessage()` switch-case.

---

## Best Practices Applied

- **No global mutable state** — `BotContext` is constructed fresh per request
- **`ctx.waitUntil()`** — user upsert runs after the response is sent (non-blocking)
- **Bindings over REST** — D1, KV, Queues accessed via native bindings, never REST API
- **Timing-safe secret verification** — `crypto.subtle.timingSafeEqual` in `webhook-auth.ts`
- **`crypto.randomUUID()`** — used for IDs, never `Math.random()`
- **Structured JSON logging** — searchable in Workers Observability dashboard
- **Always `await` Promises** — no floating promises; `waitUntil` for fire-and-forget
- **`satisfies ExportedHandler<Env>`** — full type safety on the export
- **`wrangler types`** — `Env` is generated, never hand-written
- **Explicit error handling** — try/catch everywhere, always return 200 to Telegram

---

## Scripts Reference

| Command                   | Description                                   |
|---------------------------|-----------------------------------------------|
| `npm run dev`             | Local dev with Wrangler                       |
| `npm run deploy`          | Deploy to workers.dev                         |
| `npm run deploy:production` | Deploy to production environment            |
| `npm run types`           | Regenerate `worker-configuration.d.ts`        |
| `npm run type-check`      | `tsc --noEmit` type validation                |
| `npm run lint`            | ESLint (includes `no-floating-promises`)      |
| `npm test`                | Run Vitest in Workers runtime                 |
| `npm run db:migrate`      | Apply D1 migrations (dev)                     |
| `npm run db:migrate:prod` | Apply D1 migrations (production)              |
