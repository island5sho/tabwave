import axios from "axios";
import { Command } from "commander";
import { TabSession } from "../../types/session";

const BASE_URL = process.env.TABWAVE_SERVER ?? "http://localhost:3000";

export function printPreview(session: TabSession, maxTabs = 5): void {
  const tabs = session.tabs.slice(0, maxTabs);
  const remaining = session.tabs.length - tabs.length;

  console.log(`Session: ${session.name} (${session.id})`);
  console.log(`  Tabs: ${session.tabs.length}`);
  if (session.tags && session.tags.length > 0) {
    console.log(`  Tags: ${session.tags.join(", ")}`);
  }
  if (session.label) {
    console.log(`  Label: ${session.label}`);
  }
  console.log(`  Updated: ${new Date(session.updatedAt).toLocaleString()}`);
  console.log(`  Preview:`);

  for (const tab of tabs) {
    const title = tab.title ? tab.title.slice(0, 60) : tab.url;
    console.log(`    - ${title}`);
  }

  if (remaining > 0) {
    console.log(`    ... and ${remaining} more tab(s)`);
  }
}

export function createPreviewCommand(): Command {
  const cmd = new Command("preview");

  cmd
    .description("Preview a session's tabs without opening them")
    .argument("<id>", "Session ID to preview")
    .option("-n, --max-tabs <number>", "Maximum number of tabs to display", "5")
    .action(async (id: string, options: { maxTabs: string }) => {
      const maxTabs = parseInt(options.maxTabs, 10);

      if (isNaN(maxTabs) || maxTabs < 1) {
        console.error("Error: --max-tabs must be a positive integer");
        process.exit(1);
      }

      try {
        const res = await axios.get<TabSession>(`${BASE_URL}/sessions/${id}`);
        printPreview(res.data, maxTabs);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Error: Session '${id}' not found`);
        } else {
          console.error("Error fetching session:", err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
