import axios from "axios";
import { Command } from "commander";
import { TabSession } from "../../types/session";

export interface CountResult {
  total: number;
  byTag: Record<string, number>;
  byDevice: Record<string, number>;
  totalTabs: number;
}

export function computeCount(sessions: TabSession[]): CountResult {
  const byTag: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  let totalTabs = 0;

  for (const session of sessions) {
    totalTabs += session.tabs?.length ?? 0;

    const device = session.device ?? "unknown";
    byDevice[device] = (byDevice[device] ?? 0) + 1;

    for (const tag of session.tags ?? []) {
      byTag[tag] = (byTag[tag] ?? 0) + 1;
    }
  }

  return { total: sessions.length, byTag, byDevice, totalTabs };
}

export function printCount(result: CountResult, verbose: boolean): void {
  console.log(`Sessions: ${result.total}`);
  console.log(`Total tabs: ${result.totalTabs}`);

  if (verbose) {
    if (Object.keys(result.byDevice).length > 0) {
      console.log("\nBy device:");
      for (const [device, count] of Object.entries(result.byDevice)) {
        console.log(`  ${device}: ${count}`);
      }
    }

    if (Object.keys(result.byTag).length > 0) {
      console.log("\nBy tag:");
      for (const [tag, count] of Object.entries(result.byTag)) {
        console.log(`  ${tag}: ${count}`);
      }
    }
  }
}

export function createCountCommand(baseUrl: string): Command {
  const cmd = new Command("count");
  cmd
    .description("Count sessions and tabs, optionally broken down by tag or device")
    .option("-v, --verbose", "show breakdown by device and tag", false)
    .action(async (opts) => {
      try {
        const res = await axios.get<TabSession[]>(`${baseUrl}/sessions`);
        const result = computeCount(res.data);
        printCount(result, opts.verbose);
      } catch (err: any) {
        console.error("Error fetching sessions:", err.message);
        process.exit(1);
      }
    });
  return cmd;
}
