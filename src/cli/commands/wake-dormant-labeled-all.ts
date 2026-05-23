import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantLabeledAllResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantLabeledAllResult(
  result: WakeDormantLabeledAllResult
): void {
  if (result.woken.length === 0) {
    console.log('No dormant sessions with that label were found.');
    return;
  }
  console.log(`Woke ${result.woken.length} session(s) with label:`);
  for (const id of result.woken) {
    console.log(`  + ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or missing label).`);
  }
}

export function createWakeDormantLabeledAllCommand(): Command {
  return new Command('wake-dormant-labeled-all')
    .description('Wake all dormant sessions that carry a specific label')
    .requiredOption('-l, --label <label>', 'Label to match')
    .option('-H, --host <host>', 'Server host', 'http://localhost:3000')
    .action(async (opts) => {
      try {
        const res = await axios.post(
          `${opts.host}/sessions/wake-dormant-labeled-all`,
          { label: opts.label }
        );
        printWakeDormantLabeledAllResult(res.data);
      } catch (err: any) {
        console.error(
          'Error:',
          err.response?.data?.error ?? err.message
        );
        process.exit(1);
      }
    });
}
