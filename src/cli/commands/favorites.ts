import axios from "axios";
import { Command } from "commander";
import { Session } from "../../types/session";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

export function createFavoritesCommand(): Command {
  const cmd = new Command("favorites");

  cmd
    .description("List all favorited sessions")
    .action(async () => {
      try {
        const res = await axios.get<Session[]>(`${BASE_URL}/sessions/favorites`);
        const sessions = res.data;

        if (sessions.length === 0) {
          console.log("No favorite sessions found.");
          return;
        }

        console.log(`Favorite sessions (${sessions.length}):`);
        for (const session of sessions) {
          const tabCount = session.tabs?.length ?? 0;
          console.log(`  ★ [${session.id}] ${session.name} — ${tabCount} tab(s)`);
        }
      } catch (err: any) {
        console.error("Failed to fetch favorites:", err.message);
        process.exit(1);
      }
    });

  return cmd;
}
