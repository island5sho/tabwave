import axios from "axios";
import { Command } from "commander";

export function createFreezeCommand(): Command {
  const cmd = new Command("freeze");

  cmd
    .description("Freeze a session to prevent it from being modified or overwritten")
    .argument("<sessionId>", "ID of the session to freeze")
    .option("--unfreeze", "Remove the frozen state from the session")
    .option("--port <port>", "Server port", "3000")
    .action(async (sessionId: string, options: { unfreeze?: boolean; port: string }) => {
      const base = `http://localhost:${options.port}`;
      const action = options.unfreeze ? "unfreeze" : "freeze";

      try {
        const res = await axios.patch(`${base}/sessions/${sessionId}/freeze`, {
          frozen: !options.unfreeze,
        });

        const session = res.data;
        const state = session.frozen ? "frozen" : "unfrozen";
        console.log(`Session "${session.name}" (${sessionId}) is now ${state}.`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session not found: ${sessionId}`);
        } else {
          console.error(`Failed to ${action} session:`, err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
