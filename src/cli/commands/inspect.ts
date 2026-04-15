import axios from "axios";
import { Command } from "commander";
import { TabSession } from "../../types/session";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

export function printInspect(session: TabSession): void {
  console.log(`Session: ${session.name} (${session.id})`);
  console.log(`  Created : ${new Date(session.createdAt).toLocaleString()}`);
  console.log(`  Updated : ${new Date(session.updatedAt).toLocaleString()}`);
  console.log(`  Tabs    : ${session.tabs.length}`);
  if (session.tags && session.tags.length > 0) {
    console.log(`  Tags    : ${session.tags.join(", ")}`);
  }
  if (session.labels && session.labels.length > 0) {
    console.log(`  Labels  : ${session.labels.join(", ")}`);
  }
  if (session.note) {
    console.log(`  Note    : ${session.note}`);
  }
  console.log(`  Pinned  : ${session.pinned ? "yes" : "no"}`);
  console.log(`  Locked  : ${session.locked ? "yes" : "no"}`);
  console.log(`  Archived: ${session.archived ? "yes" : "no"}`);
  console.log("  --- Tabs ---");
  session.tabs.forEach((tab, i) => {
    console.log(`  [${i + 1}] ${tab.title ?? "(no title)"}`);
    console.log(`      ${tab.url}`);
  });
}

export function createInspectCommand(): Command {
  return new Command("inspect")
    .description("Show detailed information about a session")
    .argument("<id>", "Session ID")
    .option("--json", "Output raw JSON")
    .action(async (id: string, opts: { json?: boolean }) => {
      try {
        const res = await axios.get<TabSession>(`${BASE_URL}/sessions/${id}`);
        if (opts.json) {
          console.log(JSON.stringify(res.data, null, 2));
        } else {
          printInspect(res.data);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${id}" not found.`);
        } else {
          console.error("Failed to inspect session:", err.message);
        }
        process.exit(1);
      }
    });
}
