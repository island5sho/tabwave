import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantFavoritedResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantFavoritedResult(result: WakeDormantFavoritedResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant favorited sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} dormant favorited session(s):`);
  for (const id of result.woken) {
    console.log(`  + ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or not favorited).`);
  }
}

export function createWakeDormantFavoritedCommand(): Command {
  const cmd = new Command('wake-dormant-favorited');
  cmd
    .description('Wake all dormant sessions that are marked as favorited')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-favorited`);
        printWakeDormantFavoritedResult(res.data);
      } catch (err: any) {
        console.error('Failed to wake dormant favorited sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
