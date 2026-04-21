import axios from "axios";
import { Command } from "commander";

export interface FocusResult {
  sessionId: string;
  name: string;
  focusedAt: string;
  previousFocus: string | null;
}

export function printFocusResult(result: FocusResult): void {
  if (result.previousFocus) {
    console.log(`Unfocused: ${result.previousFocus}`);
  }
  console.log(`Focused session: ${result.name} (${result.sessionId})`);
  console.log(`Focused at: ${new Date(result.focusedAt).toLocaleString()}`);
}

export function createFocusCommand(): Command {
  const cmd = new Command("focus");

  cmd
    .description("Mark a session as the currently active/focused session")
    .argument("<sessionId>", "ID of the session to focus")
    .option("--host <host>", "Server host", "localhost")
    .option("--port <port>", "Server port", "3000")
    .option("--quiet", "Suppress output")
    .action(async (sessionId: string, options) => {
      const base = `http://${options.host}:${options.port}`;
      try {
        const res = await axios.post(`${base}/sessions/${sessionId}/focus`);
        if (!options.quiet) {
          printFocusResult(res.data as FocusResult);
        }
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
