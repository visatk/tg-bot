// src/bot/commands/index.ts
// Central command registry. Register all command handlers here.
// The router reads this to dispatch /commands and also to set bot commands
// via setMyCommands.

import type { CommandHandler } from "../../types/bot";
import { startCommand } from "./start";
import { helpCommand } from "./help";
import { statusCommand } from "./status";

export const COMMANDS: CommandHandler[] = [
  startCommand,
  helpCommand,
  statusCommand,
  // ── Add new commands here ──────────────────────────────────────────────────
];

/** Map of command string → handler for O(1) dispatch */
export const COMMAND_MAP = new Map<string, CommandHandler>(
  COMMANDS.map((c) => [c.command, c])
);
