import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

const DEFAULT_HOST = 'http://localhost:3000';

export interface WakeAllDormantResult {
  woken: string[];
  skipped: string[];
  total: number;
}

export function printWakeAllDormantResult(result: WakeAllDormantResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant sessions found to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} dormant session(s):`);
  for (const name of result.woken) {
    console.log(`  ✓ ${name}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or protected).`);
  }
}

export function createWakeAllDormantCommand(): Command {
  const cmd = new Command('wake-all-dormant');
  cmd
    .description('Wake all dormant sessions at once')
    .option('--host <host>', 'Server host', DEFAULT_HOST)
    .option('--dry-run', 'Preview which sessions would be woken without making changes')
    .action(async (opts) => {
      try {
        const listRes = await axios.get<TabSession[]>(`${opts.host}/sessions`);
        const sessions: TabSession[] = listRes.data;

        const dormant = sessions.filter(
          (s) => (s as any).dormant === true && !(s as any).protected
        );

        if (opts.dryRun) {
          if (dormant.length === 0) {
            console.log('No dormant sessions to wake.');
          } else {
            console.log(`Would wake ${dormant.length} dormant session(s):`);
            dormant.forEach((s) => console.log(`  - ${s.name}`));
          }
          return;
        }

        const woken: string[] = [];
        const skipped: string[] = [];

        for (const session of sessions) {
          if ((session as any).dormant && !(session as any).protected) {
            await axios.post(`${opts.host}/sessions/${session.id}/wake`);
            woken.push(session.name);
          } else {
            skipped.push(session.name);
          }
        }

        printWakeAllDormantResult({ woken, skipped, total: sessions.length });
      } catch (err: any) {
        console.error('Failed to wake dormant sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
