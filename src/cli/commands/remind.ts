import axios from "axios";
import { Command } from "commander";

export interface Reminder {
  sessionId: string;
  message: string;
  remindAt: string; // ISO date string
}

export function formatReminder(r: Reminder): string {
  const date = new Date(r.remindAt);
  const formatted = date.toLocaleString();
  return `[${r.sessionId}] "${r.message}" — remind at ${formatted}`;
}

export function createRemindCommand(): Command {
  const cmd = new Command("remind");

  cmd
    .description("Set or list reminders for a session")
    .option("-l, --list", "List all reminders")
    .option("-s, --session <id>", "Session ID to attach the reminder to")
    .option("-m, --message <msg>", "Reminder message")
    .option("-t, --time <iso>", "ISO date/time to trigger the reminder")
    .option("-d, --delete <id>", "Delete a reminder by session ID")
    .option("--host <host>", "Server host", "http://localhost:3000")
    .action(async (opts) => {
      const base = opts.host;

      try {
        if (opts.list) {
          const res = await axios.get(`${base}/reminders`);
          const reminders: Reminder[] = res.data;
          if (reminders.length === 0) {
            console.log("No reminders set.");
          } else {
            reminders.forEach((r) => console.log(formatReminder(r)));
          }
          return;
        }

        if (opts.delete) {
          await axios.delete(`${base}/reminders/${opts.delete}`);
          console.log(`Reminder for session "${opts.delete}" deleted.`);
          return;
        }

        if (!opts.session || !opts.message || !opts.time) {
          console.error("--session, --message, and --time are required to set a reminder.");
          process.exit(1);
        }

        const payload: Reminder = {
          sessionId: opts.session,
          message: opts.message,
          remindAt: opts.time,
        };

        await axios.post(`${base}/reminders`, payload);
        console.log(`Reminder set for session "${opts.session}" at ${opts.time}.`);
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
