import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantFrozenResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantFrozenResult(result: WakeDormantFrozenResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant frozen sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} dormant frozen session(s):`);
  for (const id of result.woken) {
    console.log(`  + ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or not frozen).`);
  }
}

export function createWakeDormantFrozenCommand(): Command {
  const cmd = new Command('wake-dormant-frozen');
  cmd
    .description('Wake all dormant sessions that are also frozen')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-frozen`);
        printWakeDormantFrozenResult(res.data);
      } catch (err: any) {
        console.error('Error waking dormant frozen sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
