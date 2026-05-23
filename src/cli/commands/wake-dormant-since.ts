import axios from 'axios';
import { Command } from 'commander';

export function printWakeDormantSinceResult(woken: string[], skipped: string[]): void {
  if (woken.length === 0) {
    console.log('No dormant sessions matched the given time range.');
    return;
  }
  console.log(`Woke ${woken.length} dormant session(s) dormant since cutoff:`);
  for (const id of woken) {
    console.log(`  ✓ ${id}`);
  }
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} session(s) (not dormant or outside range).`);
  }
}

export function createWakeDormantSinceCommand(): Command {
  const cmd = new Command('wake-dormant-since');

  cmd
    .description('Wake all sessions that became dormant on or after a given date')
    .requiredOption('--since <date>', 'ISO date string; wake sessions dormant since this date')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-since`, {
          since: opts.since,
        });
        const { woken = [], skipped = [] } = res.data as { woken: string[]; skipped: string[] };
        printWakeDormantSinceResult(woken, skipped);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
