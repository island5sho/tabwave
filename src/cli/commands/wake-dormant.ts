import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

const PORT = process.env.TABWAVE_PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

export interface WakeDormantResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantResult(result: WakeDormantResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant sessions to wake.');
    return;
  }
  console.log(`Woke ${result.woken.length} dormant session(s):`);
  result.woken.forEach((name) => console.log(`  ✓ ${name}`));
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant):`);
    result.skipped.forEach((name) => console.log(`  - ${name}`));
  }
}

export function createWakeDormantCommand(): Command {
  const cmd = new Command('wake-dormant');

  cmd
    .description('Wake all dormant sessions, making them active again')
    .option('--tag <tag>', 'Only wake dormant sessions with a specific tag')
    .option('--dry-run', 'Preview which sessions would be woken without making changes')
    .action(async (opts) => {
      try {
        const params: Record<string, string> = {};
        if (opts.tag) params.tag = opts.tag;
        if (opts.dryRun) params.dryRun = 'true';

        const res = await axios.post(`${BASE_URL}/sessions/wake-dormant`, params);
        const result: WakeDormantResult = res.data;

        if (opts.dryRun) {
          console.log(`[dry-run] Would wake ${result.woken.length} dormant session(s):`);
          result.woken.forEach((name) => console.log(`  ~ ${name}`));
        } else {
          printWakeDormantResult(result);
        }
      } catch (err: any) {
        console.error('Failed to wake dormant sessions:', err.message);
        process.exit(1);
      }
    });

  return cmd;
}
