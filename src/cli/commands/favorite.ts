import axios from "axios";
import { Command } from "commander";
import { Session } from "../../types/session";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

export function createFavoriteCommand(): Command {
  const cmd = new Command("favorite");

  cmd
    .description("Mark or unmark a session as a favorite")
    .argument("<sessionId>", "ID of the session to favorite/unfavorite")
    .option("-u, --unset", "Remove favorite status", false)
    .action(async (sessionId: string, options: { unset: boolean }) => {
      try {
        const res = await axios.patch<Session>(
          `${BASE_URL}/sessions/${sessionId}/favorite`,
          { favorite: !options.unset }
        );
        const session = res.data;
        const status = session.favorite ? "marked as favorite" : "unfavorited";
        console.log(`Session "${session.name}" ${status}.`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error("Failed to update favorite status:", err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
