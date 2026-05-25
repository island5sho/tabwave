import axios from 'axios';
import { Command } from 'commander';

export function printWakeDormantScheduledResult(woken: string[]): void {
  if (woken.length === 0) {
    console.log('No dormant scheduled sessions to wake.');
    return;
  }
  console.log(`Woke ${woken.length} dormant scheduled session(s):`);
  for (const id of woken) {
    console.log(`  - ${id}`);
  }
}

export function createWakeDormantScheduledCommand(): Command {
  const cmd = new Command('wake-dormant-scheduled');
  cmd
    .description('Wake all dormant sessions that have a past scheduled time')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-scheduled`);
        printWakeDormantScheduledResult(res.data.woken ?? []);
      } catch (err: any) {
        console.error('Failed to wake dormant scheduled sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
