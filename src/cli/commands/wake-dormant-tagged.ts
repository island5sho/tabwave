import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantTaggedResult {
  woken: string[];
  skipped: string[];
  tag: string;
}

export function printWakeDormantTaggedResult(result: WakeDormantTaggedResult): void {
  console.log(`Tag: ${result.tag}`);
  if (result.woken.length === 0) {
    console.log('No dormant sessions with this tag were woken.');
  } else {
    console.log(`Woken (${result.woken.length}):`);
    result.woken.forEach((id) => console.log(`  + ${id}`));
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped (${result.skipped.length}):`);
    result.skipped.forEach((id) => console.log(`  - ${id}`));
  }
}

export function createWakeDormantTaggedCommand(): Command {
  const cmd = new Command('wake-dormant-tagged');

  cmd
    .description('Wake all dormant sessions that have a specific tag')
    .argument('<tag>', 'Tag to filter dormant sessions by')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (tag: string, options: { host: string; port: string }) => {
      const base = `http://${options.host}:${options.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-tagged`, { tag });
        printWakeDormantTaggedResult(res.data as WakeDormantTaggedResult);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
