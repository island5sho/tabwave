import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

const DORMANT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export interface DormantReport {
  totalDormant: number;
  sessions: Array<{ name: string; daysSinceActive: number; protected: boolean; frozen: boolean }>;
}

export function buildDormantReport(sessions: TabSession[]): DormantReport {
  const now = Date.now();
  const dormant = sessions
    .filter((s) => now - new Date(s.updatedAt).getTime() >= DORMANT_THRESHOLD_MS)
    .map((s) => ({
      name: s.name,
      daysSinceActive: Math.floor((now - new Date(s.updatedAt).getTime()) / (24 * 60 * 60 * 1000)),
      protected: !!(s as any).protected,
      frozen: !!(s as any).frozen,
    }))
    .sort((a, b) => b.daysSinceActive - a.daysSinceActive);
  return { totalDormant: dormant.length, sessions: dormant };
}

export function printDormantReport(report: DormantReport): void {
  if (report.totalDormant === 0) {
    console.log('No dormant sessions found.');
    return;
  }
  console.log(`Found ${report.totalDormant} dormant session(s):`);
  for (const s of report.sessions) {
    const flags = [s.protected ? 'protected' : '', s.frozen ? 'frozen' : '']
      .filter(Boolean)
      .join(', ');
    const flagStr = flags ? ` [${flags}]` : '';
    console.log(`  ${s.name} — inactive for ${s.daysSinceActive} day(s)${flagStr}`);
  }
}

export function createDormantReportCommand(baseUrl: string): Command {
  const cmd = new Command('dormant-report');
  cmd
    .description('Show a report of all dormant sessions and their inactivity duration')
    .action(async () => {
      try {
        const res = await axios.get(`${baseUrl}/sessions`);
        const sessions: TabSession[] = res.data;
        const report = buildDormantReport(sessions);
        printDormantReport(report);
      } catch (err: any) {
        console.error('Error fetching sessions:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
  return cmd;
}
