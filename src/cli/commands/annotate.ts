import axios from "axios";
import { Command } from "commander";

const BASE_URL = process.env.TABWAVE_URL ?? "http://localhost:3000";

export function createAnnotateCommand(): Command {
  const cmd = new Command("annotate");

  cmd
    .description("Add or update an annotation on a session")
    .argument("<sessionId>", "ID of the session to annotate")
    .option("-t, --text <text>", "Annotation text to set")
    .option("--clear", "Remove the existing annotation")
    .action(async (sessionId: string, opts: { text?: string; clear?: boolean }) => {
      if (!opts.text && !opts.clear) {
        console.error("Error: provide --text <text> or --clear");
        process.exit(1);
      }

      const annotation = opts.clear ? "" : (opts.text ?? "");

      try {
        const res = await axios.patch(
          `${BASE_URL}/sessions/${sessionId}/annotate`,
          { annotation }
        );

        if (opts.clear) {
          console.log(`Annotation cleared for session "${res.data.name}".`);
        } else {
          console.log(`Annotation set for session "${res.data.name}": ${annotation}`);
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error("Failed to annotate session:", err?.response?.data?.error ?? err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
