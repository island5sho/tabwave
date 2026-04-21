import axios from "axios";
import { Command } from "commander";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

export function createActivateCommand(): Command {
  const cmd = new Command("activate");

  cmd
    .description("Mark a session as the currently active session")
    .argument("<id>", "Session ID to activate")
    .option("--deactivate-others", "Deactivate all other sessions before activating", false)
    .action(async (id: string, options: { deactivateOthers: boolean }) => {
      try {
        const res = await axios.patch(`${BASE_URL}/sessions/${id}/activate`, {
          deactivateOthers: options.deactivateOthers,
        });

        const session = res.data;
        console.log(`✓ Session "${session.name}" is now active.`);

        if (options.deactivateOthers) {
          console.log("  All other sessions have been deactivated.");
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Error: Session "${id}" not found.`);
        } else {
          console.error("Error activating session:", err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
