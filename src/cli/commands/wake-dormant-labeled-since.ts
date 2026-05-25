import { Command } from 'commander';
import axios from 'axios';

export interface WakeDormantLabeledSinceResult {
  woken: string[];
}

export function printWakeDormantLabeledSinceResult(result: WakeDormantLabeledSinceResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant labeled sessions found matching criteria.');
  } else {
    console.log(`Woke ${result.woken.length} dormant labeled session(s):`);
    result.woken.forEach((id) => console.log(`  - ${id}`));
  }
}

export function createWakeDormantLabeledSinceCommand(): Command {
  const cmd = new Command('wake-dormant-labeled-since');
  cmd
    .description('Wake dormant sessions that have a label and have been dormant since a given date')
    .requiredOption('--since <date>', 'ISO date string threshold')
    .option('--label <label>', 'Filter by specific label')
    .option('--host <host>', 'Server host', 'http://localhost:3000')
    .action(async (opts) => {
      try {
        const params: Record<string, string> = { since: opts.since };
        if (opts.label) params.label = opts.label;
        const res = await axios.post(`${opts.host}/sessions/wake-dormant-labeled-since`, params);
        printWakeDormantLabeledSinceResult(res.data);
      } catch (err: any) {
        console.error('Error:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
  return cmd;
}
