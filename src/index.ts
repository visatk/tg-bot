import { Hono } from "hono";
import type { TelegramUpdate } from "./types/telegram";
import { buildContext } from "./bot/context";
import { routeUpdate } from "./bot/router";
import { webhookAuth } from "./middleware/webhook-auth";
import { createLogger } from "./middleware/logger";
import type { LogLevel } from "./middleware/logger";
import { TelegramClient } from "./services/telegram";

// ─── Hono App ─────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();

// ── Health check (public) ─────────────────────────────────────────────────────
app.get("/health", (c) => c.json({ status: "ok", ts: Date.now() }));

// ── Webhook setup endpoint (call once after deploy to register the webhook) ───
// POST /setup?secret=<WEBHOOK_SECRET>
app.post("/setup", async (c) => {
  const secret = c.req.query("secret");
  if (!secret || secret !== c.env.WEBHOOK_SECRET) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const telegram = new TelegramClient(c.env.BOT_TOKEN);
  const webhookUrl = new URL(c.req.url);
  webhookUrl.pathname = "/webhook";

  await telegram.setWebhook(webhookUrl.origin + "/webhook", c.env.WEBHOOK_SECRET);
  const me = await telegram.getMe();

  return c.json({
    ok: true,
    webhook: webhookUrl.origin + "/webhook",
    bot: me,
  });
});

// ── Telegram webhook (authenticated) ─────────────────────────────────────────
app.post("/webhook", webhookAuth(), async (c) => {
  const log = createLogger((c.env.LOG_LEVEL as LogLevel) ?? "info");

  let update: TelegramUpdate;
  try {
    update = await c.req.json<TelegramUpdate>();
  } catch {
    log.error("failed to parse update body");
    // Always return 200 to Telegram — returning non-200 triggers retries
    return c.json({ ok: false }, 200);
  }

  log.info("update received", { update_id: update.update_id });

  const botCtx = buildContext(update, c.env, c.executionCtx);

  // Process the update. Any uncaught error is caught here so we always
  // respond 200 to Telegram (prevents indefinite retry storms).
  try {
    await routeUpdate(botCtx);
  } catch (err) {
    log.error("unhandled error in routeUpdate", {
      error: err instanceof Error ? err.message : String(err),
      update_id: update.update_id,
    });
  }

  return c.json({ ok: true });
});

// ── Catch-all 404 ─────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ error: "Not found" }, 404));

// ── Global error handler ──────────────────────────────────────────────────────
app.onError((err, c) => {
  const log = createLogger((c.env.LOG_LEVEL as LogLevel) ?? "info");
  log.error("unhandled Hono error", {
    error: err.message,
    path: new URL(c.req.url).pathname,
  });
  return c.json({ error: "Internal server error" }, 500);
});

// ─── Queue Consumer ───────────────────────────────────────────────────────────

async function handleQueue(
  batch: MessageBatch<BotQueueMessage>,
  env: Env
): Promise<void> {
  const log = createLogger((env.LOG_LEVEL as LogLevel) ?? "info", {
    queue: batch.queue,
    batch_size: batch.messages.length,
  });

  log.info("processing queue batch");

  for (const msg of batch.messages) {
    try {
      await processQueueMessage(msg.body, env, log);
      msg.ack();
    } catch (err) {
      log.error("failed to process queue message", {
        type: msg.body.type,
        error: err instanceof Error ? err.message : String(err),
      });
      msg.retry();
    }
  }
}

async function processQueueMessage(
  body: BotQueueMessage,
  env: Env,
  log: ReturnType<typeof createLogger>
): Promise<void> {
  switch (body.type) {
    case "analytics":
      // Write analytics to D1, Analytics Engine, or a third-party service
      log.info("analytics event", { payload: body.payload });
      break;

    case "notification": {
      // Fan-out notifications, scheduled messages, etc.
      log.info("notification event", { payload: body.payload });
      break;
    }

    case "cleanup":
      // Periodic cleanup tasks triggered by a cron
      log.info("cleanup event");
      break;

    default:
      log.warn("unknown queue message type", { type: (body as { type: string }).type });
  }
}

// ─── Scheduled Handler (Cron) ─────────────────────────────────────────────────
// Enable by adding `crons` to wrangler.jsonc:
//   "triggers": { "crons": ["0 * * * *"] }

async function handleScheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const log = createLogger((env.LOG_LEVEL as LogLevel) ?? "info", {
    cron: event.cron,
    scheduledTime: event.scheduledTime,
  });

  log.info("cron triggered");

  // Example: enqueue a cleanup task
  ctx.waitUntil(
    env.EVENT_QUEUE.send({
      type: "cleanup",
      payload: null,
      timestamp: Date.now(),
    })
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  fetch: app.fetch,
  queue: handleQueue,
  scheduled: handleScheduled,
} satisfies ExportedHandler<Env>;
