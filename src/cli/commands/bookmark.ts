import axios from "axios";
import { Command } from "commander";

const BASE_URL = process.env.TABWAVE_URL || "http://localhost:3000";

export function createBookmarkCommand(): Command {
  const cmd = new Command("bookmark");

  cmd
    .description("Bookmark a specific tab URL within a session")
    .argument("<sessionId>", "Session ID to bookmark a tab in")
    .argument("<url>", "URL of the tab to bookmark")
    .option("-l, --label <label>", "Optional label for the bookmark")
    .option("--list", "List all bookmarked tabs in the session")
    .option("--remove", "Remove a bookmark by URL")
    .action(async (sessionId: string, url: string, opts) => {
      try {
        if (opts.list) {
          const res = await axios.get(`${BASE_URL}/sessions/${sessionId}/bookmarks`);
          const bookmarks: { url: string; label?: string }[] = res.data.bookmarks;
          if (!bookmarks || bookmarks.length === 0) {
            console.log("No bookmarks found.");
            return;
          }
          bookmarks.forEach((b) => {
            const labelPart = b.label ? ` [${b.label}]` : "";
            console.log(`  • ${b.url}${labelPart}`);
          });
          return;
        }

        if (opts.remove) {
          await axios.delete(`${BASE_URL}/sessions/${sessionId}/bookmarks`, {
            data: { url },
          });
          console.log(`Bookmark removed: ${url}`);
          return;
        }

        const payload: { url: string; label?: string } = { url };
        if (opts.label) payload.label = opts.label;

        await axios.post(`${BASE_URL}/sessions/${sessionId}/bookmarks`, payload);
        const labelMsg = opts.label ? ` as "${opts.label}"` : "";
        console.log(`Bookmarked${labelMsg}: ${url}`);
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
