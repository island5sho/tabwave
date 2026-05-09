import axios from "axios";
import { Command } from "commander";
import * as readline from "readline";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

function promptConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export function createResetCommand(): Command {
  const cmd = new Command("reset");

  cmd
    .description("Delete all sessions from the store")
    .option("-f, --force", "Skip confirmation prompt")
    .action(async (opts) => {
      try {
        if (!opts.force) {
          const confirmed = await promptConfirm(
            "This will permanently delete ALL sessions. Are you sure?"
          );
          if (!confirmed) {
            console.log("Reset cancelled.");
            process.exit(0);
          }
        }

        const res = await axios.delete(`${BASE_URL}/sessions/reset`);
        const { deleted } = res.data as { deleted: number };
        console.log(`Reset complete. ${deleted} session(s) removed.`);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
