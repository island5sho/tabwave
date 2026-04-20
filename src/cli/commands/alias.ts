import axios from "axios";
import { Command } from "commander";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

/**
 * Manages short aliases for session IDs so users can reference sessions
 * by a memorable name instead of a full UUID.
 *
 * Aliases are stored as metadata on the session object under `session.alias`.
 */
export function createAliasCommand(): Command {
  const cmd = new Command("alias");

  cmd
    .description("Set or remove a short alias for a session")
    .argument("<sessionId>", "ID of the session to alias")
    .argument("[alias]", "Alias name to assign (omit to clear the alias)")
    .option("-r, --remove", "Remove the existing alias from the session")
    .action(async (sessionId: string, alias: string | undefined, opts: { remove?: boolean }) => {
      try {
        // Fetch the target session
        const { data: session } = await axios.get(`${BASE_URL}/sessions/${sessionId}`);

        if (opts.remove || alias === undefined) {
          // Clear the alias
          const previous = session.alias as string | undefined;
          if (!previous) {
            console.log(`Session "${sessionId}" has no alias to remove.`);
            return;
          }
          delete session.alias;
          await axios.put(`${BASE_URL}/sessions/${sessionId}`, session);
          console.log(`Alias "${previous}" removed from session "${sessionId}".`);
          return;
        }

        // Validate alias: alphanumeric, hyphens, underscores only
        if (!/^[a-zA-Z0-9_-]{1,32}$/.test(alias)) {
          console.error(
            "Error: Alias must be 1–32 characters and contain only letters, numbers, hyphens, or underscores."
          );
          process.exit(1);
        }

        // Check if alias is already taken by another session
        const { data: allSessions } = await axios.get(`${BASE_URL}/sessions`);
        const conflict = (allSessions as Array<{ id: string; alias?: string }>).find(
          (s) => s.alias === alias && s.id !== sessionId
        );
        if (conflict) {
          console.error(
            `Error: Alias "${alias}" is already used by session "${conflict.id}".`
          );
          process.exit(1);
        }

        const previous = session.alias as string | undefined;
        session.alias = alias;
        await axios.put(`${BASE_URL}/sessions/${sessionId}`, session);

        if (previous) {
          console.log(
            `Alias updated: "${previous}" → "${alias}" for session "${sessionId}".`
          );
        } else {
          console.log(`Alias "${alias}" set for session "${sessionId}".`);
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          console.error(`Error: Session "${sessionId}" not found.`);
        } else {
          console.error("Error:", err instanceof Error ? err.message : String(err));
        }
        process.exit(1);
      }
    });

  return cmd;
}
