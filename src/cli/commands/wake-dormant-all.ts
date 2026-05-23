import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

export interface WakeDormantAllResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantAllResult(result: WakeDormantAllResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} dormant session(s):`);
  for (const name of result.woken) {
    console.log(`  ✓ ${name}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (protected or frozen).`);
  }
}

export function createWakeDormantAllCommand(baseUrl: string): Command {
  const cmd = new Command('wake-dormant-all');
  cmd
    .description('Wake all dormant sessions at once')
    .option('--force', 'Include protected sessions', false)
    .action(async (opts) => {
      try {
        const res = await axios.post(`${baseUrl}/sessions/wake-dormant-all`, {
          force: opts.force,
        });
        printWakeDormantAllResult(res.data as WakeDormantAllResult);
      } catch (err: any) {
        console.error('Error waking dormant sessions:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
  return cmd;
}
