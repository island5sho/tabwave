import axios from "axios";
import { Command } from "commander";
import { TabSession } from "../../types/session";

export interface SessionStats {
  totalSessions: number;
  totalTabs: number;
  archivedSessions: number;
  pinnedSessions: number;
  taggedSessions: number;
  avgTabsPerSession: number;
  mostUsedTags: { tag: string; count: number }[];
}

export function computeStats(sessions: TabSession[]): SessionStats {
  const totalSessions = sessions.length;
  const totalTabs = sessions.reduce((sum, s) => sum + s.tabs.length, 0);
  const archivedSessions = sessions.filter((s) => s.archived).length;
  const pinnedSessions = sessions.filter((s) => s.pinned).length;
  const taggedSessions = sessions.filter(
    (s) => s.tags && s.tags.length > 0
  ).length;
  const avgTabsPerSession =
    totalSessions > 0 ? Math.round((totalTabs / totalSessions) * 10) / 10 : 0;

  const tagCounts: Record<string, number> = {};
  for (const session of sessions) {
    for (const tag of session.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const mostUsedTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalSessions,
    totalTabs,
    archivedSessions,
    pinnedSessions,
    taggedSessions,
    avgTabsPerSession,
    mostUsedTags,
  };
}

export function printStats(stats: SessionStats): void {
  console.log("\n📊 Session Statistics");
  console.log("─────────────────────────");
  console.log(`  Total sessions   : ${stats.totalSessions}`);
  console.log(`  Total tabs       : ${stats.totalTabs}`);
  console.log(`  Avg tabs/session : ${stats.avgTabsPerSession}`);
  console.log(`  Archived         : ${stats.archivedSessions}`);
  console.log(`  Pinned           : ${stats.pinnedSessions}`);
  console.log(`  Tagged           : ${stats.taggedSessions}`);
  if (stats.mostUsedTags.length > 0) {
    console.log("  Top tags         :");
    for (const { tag, count } of stats.mostUsedTags) {
      console.log(`    #${tag} (${count})`);
    }
  }
  console.log("");
}

export function createStatsCommand(baseUrl: string): Command {
  return new Command("stats")
    .description("Show statistics about all stored sessions")
    .action(async () => {
      try {
        const res = await axios.get<TabSession[]>(`${baseUrl}/sessions`);
        const stats = computeStats(res.data);
        printStats(stats);
      } catch (err: any) {
        console.error("Failed to fetch sessions:", err.message);
        process.exit(1);
      }
    });
}
