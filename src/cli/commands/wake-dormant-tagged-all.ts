import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantTaggedAllResult {
  tag: string;
  wokeCount: number;
  sessionNames: string[];
}

export function printWakeDormantTaggedAllResult(result: WakeDormantTaggedAllResult): void {
  if (result.wokeCount === 0) {
    console.log(`No dormant sessions found with tag "${result.tag}".`);
    return;
  }
  console.log(`Woke ${result.wokeCount} dormant session(s) tagged "${result.tag}":`);
  for (const name of result.sessionNames) {
    console.log(`  - ${name}`);
  }
}

export function createWakeDormantTaggedAllCommand(): Command {
  const cmd = new Command('wake-dormant-tagged-all');
  cmd
    .description('Wake all dormant sessions that share a given tag')
    .argument('<tag>', 'Tag to match against dormant sessions')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (tag: string, options: { host: string; port: string }) => {
      const base = `http://${options.host}:${options.port}`;
      try {
        const res = await axios.post<WakeDormantTaggedAllResult>(
          `${base}/sessions/wake-dormant-tagged-all`,
          { tag }
        );
        printWakeDormantTaggedAllResult(res.data);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
