import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantTaggedAllResult {
  tag: string;
  woken: string[];
  skipped: string[];
}

export function printWakeDormantTaggedAllResult(
  result: WakeDormantTaggedAllResult
): void {
  if (result.woken.length === 0) {
    console.log(`No dormant sessions with tag "${result.tag}" found.`);
    return;
  }
  console.log(
    `Woke ${result.woken.length} dormant session(s) with tag "${result.tag}":`
  );
  for (const id of result.woken) {
    console.log(`  ✓ ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (not dormant or tag mismatch).`);
  }
}

export function createWakeDormantTaggedAllCommand(): Command {
  const cmd = new Command('wake-dormant-tagged-all');
  cmd
    .description('Wake all dormant sessions that share a given tag')
    .argument('<tag>', 'Tag to filter dormant sessions by')
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
        const msg =
          err?.response?.data?.error ?? err.message ?? 'Unknown error';
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
