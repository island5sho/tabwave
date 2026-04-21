import axios from "axios";
import { Command } from "commander";

export function createUntagCommand(): Command {
  const cmd = new Command("untag");

  cmd
    .description("Remove one or more tags from a session")
    .argument("<sessionId>", "ID of the session to untag")
    .argument("<tags...>", "Tags to remove")
    .option("-p, --port <port>", "Server port", "3000")
    .action(async (sessionId: string, tags: string[], options: { port: string }) => {
      const baseUrl = `http://localhost:${options.port}`;

      try {
        const res = await axios.patch(`${baseUrl}/sessions/${sessionId}/untag`, { tags });

        if (res.status === 200) {
          const remaining: string[] = res.data.tags ?? [];
          if (remaining.length > 0) {
            console.log(`Tags removed. Remaining tags: ${remaining.join(", ")}`);
          } else {
            console.log("Tags removed. No tags remaining on session.");
          }
        } else {
          console.error("Unexpected response from server.");
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else if (err.response?.status === 400) {
          console.error(`Bad request: ${err.response.data?.error ?? "unknown error"}`);
        } else {
          console.error("Failed to untag session:", err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
