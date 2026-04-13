import axios from "axios";
import { Command } from "commander";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

export function createNoteCommand(): Command {
  const cmd = new Command("note");

  cmd
    .description("Add or view a note attached to a session")
    .argument("<sessionId>", "ID of the session")
    .option("-s, --set <text>", "Set the note text")
    .option("-c, --clear", "Clear the existing note")
    .action(async (sessionId: string, options: { set?: string; clear?: boolean }) => {
      try {
        if (options.clear) {
          const res = await axios.patch(`${BASE_URL}/sessions/${sessionId}/note`, { note: null });
          if (res.status === 200) {
            console.log(`Note cleared for session "${sessionId}".`);
          } else {
            console.error("Failed to clear note.");
            process.exit(1);
          }
        } else if (options.set !== undefined) {
          const res = await axios.patch(`${BASE_URL}/sessions/${sessionId}/note`, { note: options.set });
          if (res.status === 200) {
            console.log(`Note updated for session "${sessionId}".`);
          } else {
            console.error("Failed to update note.");
            process.exit(1);
          }
        } else {
          const res = await axios.get(`${BASE_URL}/sessions/${sessionId}`);
          const session = res.data;
          if (session.note) {
            console.log(`Note for "${sessionId}": ${session.note}`);
          } else {
            console.log(`No note set for session "${sessionId}".`);
          }
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error("Error:", err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
