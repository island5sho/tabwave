import axios from 'axios';
import { Command } from 'commander';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export interface WakeExpiredResult {
  woken: string[];
  skipped: string[];
}

export function printWakeExpiredResult(result: WakeExpiredResult): void {
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

export function createWakeExpiredCommand(): Command {
  const cmd = new Command('wake-expired');

  cmd
    .description('Wake all expired sessions, clearing their expiry timestamps')
    .option('--dry-run', 'Preview which sessions would be woken without making changes')
    .action(async (options) => {
      try {
        const url = `${BASE_URL}/sessions/wake-expired`;
        const res = await axios.post<WakeExpiredResult>(url, {
          dryRun: !!options.dryRun,
        });

        if (options.dryRun) {
          const { woken, skipped } = res.data;
          console.log(`[dry-run] Would wake ${woken.length} session(s).`);
          for (const id of woken) {
            console.log(`  ~ ${id}`);
          }
          if (skipped.length > 0) {
            console.log(`[dry-run] Would skip ${skipped.length} session(s).`);
          }
        } else {
          printWakeExpiredResult(res.data);
        }
      } catch (err: any) {
        console.error('Failed to wake expired sessions:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });

  return cmd;
}
