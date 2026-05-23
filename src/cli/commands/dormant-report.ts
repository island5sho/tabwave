import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

export interface DormantReportEntry {
  id: string;
  name: string;
  tabCount: number;
  lastUpdated: string;
  dormantSince: string;
  daysDormant: number;
}

export function buildDormantReport(sessions: TabSession[]): DormantReportEntry[] {
  const now = Date.now();
  return sessions
    .filter((s) => s.dormant === true)
    .map((s) => {
      const dormantSince = s.dormantAt ?? s.updatedAt ?? s.createdAt;
      const daysDormant = Math.floor((now - new Date(dormantSince).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: s.id,
        name: s.name,
        tabCount: s.tabs.length,
        lastUpdated: s.updatedAt ?? s.createdAt,
        dormantSince,
        daysDormant,
      };
    })
    .sort((a, b) => b.daysDormant - a.daysDormant);
}

export function printDormantReport(entries: DormantReportEntry[]): void {
  if (entries.length === 0) {
    console.log('No dormant sessions found.');
    return;
  }
  console.log(`Dormant Sessions Report (${entries.length} total)\n`);
  console.log(`${'Name'.padEnd(28)} ${'Tabs'.padEnd(6)} ${'Days Dormant'.padEnd(14)} Dormant Since`);
  console.log('-'.repeat(72));
  for (const entry of entries) {
    const dormantDate = new Date(entry.dormantSince).toLocaleDateString();
    console.log(
      `${entry.name.padEnd(28)} ${String(entry.tabCount).padEnd(6)} ${String(entry.daysDormant).padEnd(14)} ${dormantDate}`
    );
  }
}

export function createDormantReportCommand(baseUrl: string): Command {
  const cmd = new Command('dormant-report');
  cmd
    .description('Display a report of all dormant sessions')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      try {
        const res = await axios.get(`${baseUrl}/sessions`);
        const sessions: TabSession[] = res.data;
        const report = buildDormantReport(sessions);
        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          printDormantReport(report);
        }
      } catch (err: any) {
        console.error('Failed to fetch dormant report:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
