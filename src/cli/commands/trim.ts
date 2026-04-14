import axios from "axios";
import { Command } from "commander";
import { TabSession } from "../../types/session";

export function trimTabs(
  session: TabSession,
  maxTabs: number
): { trimmed: TabSession; removed: number } {
  if (session.tabs.length <= maxTabs) {
    return { trimmed: session, removed: 0 };
  }

  const removed = session.tabs.length - maxTabs;
  const trimmed: TabSession = {
    ...session,
    tabs: session.tabs.slice(0, maxTabs),
    updatedAt: new Date().toISOString(),
  };

  return { trimmed, removed };
}

export function createTrimCommand(): Command {
  const cmd = new Command("trim");

  cmd
    .description("Trim a session to a maximum number of tabs")
    .argument("<sessionId>", "ID of the session to trim")
    .requiredOption("-m, --max <number>", "Maximum number of tabs to keep")
    .option("-h, --host <host>", "Server host", "http://localhost:3000")
    .action(async (sessionId: string, options) => {
      const maxTabs = parseInt(options.max, 10);

      if (isNaN(maxTabs) || maxTabs < 1) {
        console.error("Error: --max must be a positive integer");
        process.exit(1);
      }

      try {
        const getRes = await axios.get(
          `${options.host}/sessions/${sessionId}`
        );
        const session: TabSession = getRes.data;

        const { trimmed, removed } = trimTabs(session, maxTabs);

        if (removed === 0) {
          console.log(
            `Session "${session.name}" already has ${session.tabs.length} tab(s) — nothing to trim.`
          );
          return;
        }

        await axios.put(`${options.host}/sessions/${sessionId}`, trimmed);

        console.log(
          `Trimmed session "${session.name}": removed ${removed} tab(s), kept ${trimmed.tabs.length}.`
        );
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Error: Session "${sessionId}" not found.`);
        } else {
          console.error("Error:", err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
