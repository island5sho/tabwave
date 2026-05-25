import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantNotedResult {
  woken: string[];
}

export function printWakeDormantNotedResult(result: WakeDormantNotedResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant noted sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} dormant noted session(s):`);
  for (const id of result.woken) {
    console.log(`  - ${id}`);
  }
}

export function createWakeDormantNotedCommand(): Command {
  const cmd = new Command('wake-dormant-noted');
  cmd
    .description('Wake all dormant sessions that have a note attached')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-noted`);
        printWakeDormantNotedResult(res.data);
      } catch (err: any) {
        console.error('Failed to wake dormant noted sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
