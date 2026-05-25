import { Command } from 'commander';
import axios from 'axios';

export function printWakeDormantBookmarkedResult(woken: string[]): void {
  if (woken.length === 0) {
    console.log('No dormant bookmarked sessions to wake.');
    return;
  }
  console.log(`Woke ${woken.length} dormant bookmarked session(s):`);
  for (const id of woken) {
    console.log(`  - ${id}`);
  }
}

export function createWakeDormantBookmarkedCommand(): Command {
  const cmd = new Command('wake-dormant-bookmarked');
  cmd
    .description('Wake all dormant sessions that are bookmarked')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      try {
        const url = `http://${opts.host}:${opts.port}/sessions/wake-dormant-bookmarked`;
        const res = await axios.post(url);
        printWakeDormantBookmarkedResult(res.data.woken ?? []);
      } catch (err: any) {
        console.error('Failed to wake dormant bookmarked sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
