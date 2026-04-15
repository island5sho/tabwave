import axios from "axios";
import { Command } from "commander";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

export function createMoveCommand(): Command {
  const cmd = new Command("move");

  cmd
    .description("Move a tab from one session to another")
    .argument("<sourceSession>", "Name of the source session")
    .argument("<tabIndex>", "Zero-based index of the tab to move")
    .argument("<targetSession>", "Name of the target session")
    .option("-p, --position <pos>", "Position in target session (default: end)")
    .action(async (sourceSession: string, tabIndexStr: string, targetSession: string, opts) => {
      const tabIndex = parseInt(tabIndexStr, 10);
      if (isNaN(tabIndex) || tabIndex < 0) {
        console.error("Error: tabIndex must be a non-negative integer.");
        process.exit(1);
      }

      const position = opts.position !== undefined ? parseInt(opts.position, 10) : undefined;

      try {
        const res = await axios.post(`${BASE_URL}/sessions/move`, {
          sourceSession,
          tabIndex,
          targetSession,
          position,
        });

        const { tab, targetSession: dest } = res.data as {
          tab: { title: string; url: string };
          targetSession: string;
        };

        console.log(`Moved "${tab.title}" to session "${dest}"${
          position !== undefined ? ` at position ${position}` : ""
        }.`);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
