import axios from 'axios';
import { Command } from 'commander';

export interface WakeAllExpiredResult {
  woken: string[];
  skipped: string[];
  total: number;
}

export function printWakeAllExpiredResult(result: WakeAllExpiredResult): void {
  if (result.woken.length === 0) {
    console.log('No expired sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} expired session(s):`);
  for (const id of result.woken) {
    console.log(`  ✓ ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (protected or frozen):`);
    for (const id of result.skipped) {
      console.log(`  - ${id}`);
    }
  }
}

export function createWakeAllExpiredCommand(): Command {
  const cmd = new Command('wake-all-expired');
  cmd
    .description('Wake all expired sessions, clearing their expiry timestamps')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-all-expired`);
        printWakeAllExpiredResult(res.data);
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
