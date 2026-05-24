import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantArchivedResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantArchivedResult(result: WakeDormantArchivedResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant archived sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} dormant archived session(s):`);
  for (const id of result.woken) {
    console.log(`  ✓ ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or not archived).`);
  }
}

export function createWakeDormantArchivedCommand(): Command {
  const cmd = new Command('wake-dormant-archived');
  cmd
    .description('Wake all dormant sessions that are also archived')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-archived`);
        printWakeDormantArchivedResult(res.data);
      } catch (err: any) {
        console.error('Failed to wake dormant archived sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
