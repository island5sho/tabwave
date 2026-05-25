import axios from 'axios';
import { Command } from 'commander';

export function printWakeDormantRemindedResult(woken: string[]): void {
  if (woken.length === 0) {
    console.log('No dormant reminded sessions to wake.');
    return;
  }
  console.log(`Woke ${woken.length} dormant reminded session(s):`);
  for (const id of woken) {
    console.log(`  - ${id}`);
  }
}

export function createWakeDormantRemindedCommand(): Command {
  const cmd = new Command('wake-dormant-reminded');
  cmd
    .description('Wake all dormant sessions that have a reminder set')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-reminded`);
        printWakeDormantRemindedResult(res.data.woken ?? []);
      } catch (err: any) {
        console.error('Failed to wake dormant reminded sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
