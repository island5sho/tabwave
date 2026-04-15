import axios from "axios";
import { Command } from "commander";
import { TabSession } from "../../types/session";

export function printSummary(sessions: TabSession[]): void {
  if (sessions.length === 0) {
    console.log("No sessions found.");
    return;
  }

  const totalTabs = sessions.reduce((sum, s) => sum + s.tabs.length, 0);
  const avgTabs = (totalTabs / sessions.length).toFixed(1);
  const pinned = sessions.filter((s) => s.pinned).length;
  const archived = sessions.filter((s) => s.archived).length;
  const locked = sessions.filter((s) => s.locked).length;
  const tagged = sessions.filter((s) => s.tags && s.tags.length > 0).length;

  const allTags = sessions.flatMap((s) => s.tags ?? []);
  const tagFreq: Record<string, number> = {};
  for (const tag of allTags) {
    tagFreq[tag] = (tagFreq[tag] ?? 0) + 1;
  }
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag, count]) => `${tag}(${count})`);

  const newest = sessions.reduce((a, b) =>
    new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
  );

  console.log("=== Session Summary ===");
  console.log(`  Total sessions : ${sessions.length}`);
  console.log(`  Total tabs     : ${totalTabs}`);
  console.log(`  Avg tabs/session: ${avgTabs}`);
  console.log(`  Pinned         : ${pinned}`);
  console.log(`  Archived       : ${archived}`);
  console.log(`  Locked         : ${locked}`);
  console.log(`  Tagged         : ${tagged}`);
  if (topTags.length > 0) {
    console.log(`  Top tags       : ${topTags.join(", ")}`);
  }
  console.log(`  Last updated   : ${newest.name} (${new Date(newest.updatedAt).toLocaleString()})`);
}

export function createSummaryCommand(): Command {
  const cmd = new Command("summary");
  cmd
    .description("Display an overview summary of all sessions")
    .option("-H, --host <host>", "Server host", "localhost")
    .option("-p, --port <port>", "Server port", "3000")
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.get<TabSession[]>(`${base}/sessions`);
        printSummary(res.data);
      } catch {
        console.error("Failed to fetch sessions from server.");
        process.exit(1);
      }
    });
  return cmd;
}
