import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantTaggedSinceResult {
  woken: string[];
  skipped: string[];
}

export function printWakeDormantTaggedSinceResult(result: WakeDormantTaggedSinceResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant tagged sessions found before the given date.');
    return;
  }
  console.log(`Woke ${result.woken.length} session(s):`);
  for (const id of result.woken) {
    console.log(`  ✓ ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s).`);
  }
}

export function createWakeDormantTaggedSinceCommand(): Command {
  const cmd = new Command('wake-dormant-tagged-since');
  cmd
    .description('Wake dormant sessions with a specific tag that became dormant before a given date')
    .argument('<tag>', 'Tag to filter sessions by')
    .argument('<since>', 'ISO date string — wake sessions dormant before this date')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (tag: string, since: string, opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-tagged-since`, { tag, since });
        printWakeDormantTaggedSinceResult(res.data);
      } catch (err: any) {
        console.error('Error:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
  return cmd;
}
