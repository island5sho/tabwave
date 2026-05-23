import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantSinceAllResult {
  woken: string[];
  skipped: string[];
  since: string;
}

export function printWakeDormantSinceAllResult(result: WakeDormantSinceAllResult): void {
  const sinceDate = new Date(result.since).toLocaleString();
  if (result.woken.length === 0) {
    console.log(`No dormant sessions found inactive since ${sinceDate}.`);
    return;
  }
  console.log(`Woke ${result.woken.length} dormant session(s) inactive since ${sinceDate}:`);
  for (const id of result.woken) {
    console.log(`  ✓ ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or not matching).`);
  }
}

export function createWakeDormantSinceAllCommand(): Command {
  const cmd = new Command('wake-dormant-since-all');
  cmd
    .description('Wake all dormant sessions that have been inactive since a given date')
    .requiredOption('-s, --since <date>', 'ISO date string; wake sessions dormant since this date')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const since = new Date(opts.since);
        if (isNaN(since.getTime())) {
          console.error('Invalid date provided for --since.');
          process.exit(1);
        }
        const res = await axios.post(`${base}/sessions/wake-dormant-since-all`, {
          since: since.toISOString(),
        });
        printWakeDormantSinceAllResult(res.data as WakeDormantSinceAllResult);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
