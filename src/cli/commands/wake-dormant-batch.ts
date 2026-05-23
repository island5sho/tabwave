import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantBatchResult {
  woken: string[];
  skipped: string[];
  failed: string[];
}

export function printWakeDormantBatchResult(result: WakeDormantBatchResult): void {
  if (result.woken.length > 0) {
    console.log(`Woken (${result.woken.length}):`);
    result.woken.forEach((id) => console.log(`  ✓ ${id}`));
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped (${result.skipped.length}):`);
    result.skipped.forEach((id) => console.log(`  - ${id}`));
  }
  if (result.failed.length > 0) {
    console.log(`Failed (${result.failed.length}):`);
    result.failed.forEach((id) => console.log(`  ✗ ${id}`));
  }
  if (result.woken.length === 0 && result.skipped.length === 0 && result.failed.length === 0) {
    console.log('No dormant sessions matched the provided IDs.');
  }
}

export function createWakeDormantBatchCommand(): Command {
  const cmd = new Command('wake-dormant-batch');
  cmd
    .description('Wake multiple dormant sessions by ID')
    .argument('<ids...>', 'Session IDs to wake')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (ids: string[], options) => {
      const base = `http://${options.host}:${options.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-batch`, { ids });
        printWakeDormantBatchResult(res.data as WakeDormantBatchResult);
      } catch (err: any) {
        console.error('Error waking dormant sessions:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
  return cmd;
}
