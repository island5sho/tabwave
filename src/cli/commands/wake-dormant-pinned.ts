import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantPinnedResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantPinnedResult(result: WakeDormantPinnedResult): void {
  if (result.woken.length === 0) {
    console.log('No pinned dormant sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} pinned dormant session(s):`);
  for (const id of result.woken) {
    console.log(`  ✓ ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or not pinned).`);
  }
}

export function createWakeDormantPinnedCommand(): Command {
  const cmd = new Command('wake-dormant-pinned');
  cmd
    .description('Wake all dormant sessions that are pinned')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-pinned`);
        printWakeDormantPinnedResult(res.data as WakeDormantPinnedResult);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
