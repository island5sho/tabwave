import axios from "axios";
import { Command } from "commander";
import { TabSession } from "../../types/session";

export function formatRecap(sessions: TabSession[]): string {
  if (sessions.length === 0) return "No sessions found.";

  const totalTabs = sessions.reduce((sum, s) => sum + s.tabs.length, 0);
  const pinned = sessions.filter((s) => s.pinned).length;
  const archived = sessions.filter((s) => s.archived).length;
  const tagged = sessions.filter((s) => s.tags && s.tags.length > 0).length;

  const lines: string[] = [
    `📊 Session Recap`,
    `─────────────────────────────`,
    `  Total sessions : ${sessions.length}`,
    `  Total tabs     : ${totalTabs}`,
    `  Pinned         : ${pinned}`,
    `  Archived       : ${archived}`,
    `  Tagged         : ${tagged}`,
    `  Avg tabs/sess  : ${(totalTabs / sessions.length).toFixed(1)}`,
    `─────────────────────────────`,
  ];

  const topSession = [...sessions].sort(
    (a, b) => b.tabs.length - a.tabs.length
  )[0];
  lines.push(`  Most tabs in   : "${topSession.name}" (${topSession.tabs.length} tabs)`);

  return lines.join("\n");
}

export function createRecapCommand(baseUrl: string): Command {
  const cmd = new Command("recap");
  cmd.description("Show a summary recap of all sessions");

  cmd.action(async () => {
    try {
      const res = await axios.get(`${baseUrl}/sessions`);
      const sessions: TabSession[] = res.data;
      console.log(formatRecap(sessions));
    } catch (err: any) {
      console.error("Failed to fetch sessions:", err.message);
      process.exit(1);
    }
  });

  return cmd;
}
