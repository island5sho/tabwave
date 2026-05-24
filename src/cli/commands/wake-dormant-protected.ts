import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantProtectedResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantProtectedResult(
  result: WakeDormantProtectedResult
): void {
  if (result.woken.length === 0) {
    console.log('No dormant protected sessions to wake.');
  } else {
    console.log(`Woke ${result.woken.length} dormant protected session(s):`);
    result.woken.forEach((id) => console.log(`  - ${id}`));
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or not protected).`);
  }
}

export function createWakeDormantProtectedCommand(): Command {
  const cmd = new Command('wake-dormant-protected');
  cmd
    .description('Wake all dormant sessions that are protected')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-protected`);
        printWakeDormantProtectedResult(res.data);
      } catch (err: any) {
        console.error(
          'Failed to wake dormant protected sessions:',
          err.response?.data?.error ?? err.message
        );
        process.exit(1);
      }
    });
  return cmd;
}
