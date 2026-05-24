import { Command } from 'commander';
import axios from 'axios';

export interface WakeDormantPinnedAllResult {
  woken: string[];
  count: number;
}

export function printWakeDormantPinnedAllResult(result: WakeDormantPinnedAllResult): void {
  if (result.count === 0) {
    console.log('No dormant pinned sessions found.');
    return;
  }
  console.log(`Woke ${result.count} dormant pinned session(s):`);
  for (const id of result.woken) {
    console.log(`  - ${id}`);
  }
}

export function createWakeDormantPinnedAllCommand(): Command {
  const cmd = new Command('wake-dormant-pinned-all');

  cmd
    .description('Wake all dormant pinned sessions')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const { data } = await axios.post<WakeDormantPinnedAllResult>(
          `${base}/sessions/wake-dormant-pinned`
        );
        printWakeDormantPinnedAllResult(data);
      } catch (err: any) {
        console.error(
          'Error waking dormant pinned sessions:',
          err?.response?.data?.error ?? err.message
        );
        process.exit(1);
      }
    });

  return cmd;
}
