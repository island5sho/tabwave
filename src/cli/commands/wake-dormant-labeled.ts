import axios from 'axios';
import { Command } from 'commander';

export interface WakeDormantLabeledResult {
  label: string;
  woken: string[];
  skipped: string[];
}

export function printWakeDormantLabeledResult(
  result: WakeDormantLabeledResult
): void {
  const { label, woken, skipped } = result;
  if (woken.length === 0) {
    console.log(`No dormant sessions with label "${label}" found.`);
    return;
  }
  console.log(
    `Woke ${woken.length} dormant session(s) with label "${label}":`
  );
  for (const id of woken) {
    console.log(`  ✓ ${id}`);
  }
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} session(s) (not dormant or locked).`);
  }
}

export function createWakeDormantLabeledCommand(): Command {
  const cmd = new Command('wake-dormant-labeled');
  cmd
    .description('Wake all dormant sessions that have a specific label')
    .argument('<label>', 'label to match')
    .option('--host <host>', 'server host', 'localhost')
    .option('--port <port>', 'server port', '3000')
    .action(async (label: string, options: { host: string; port: string }) => {
      const base = `http://${options.host}:${options.port}`;
      try {
        const res = await axios.post<WakeDormantLabeledResult>(
          `${base}/sessions/wake-dormant-labeled`,
          { label }
        );
        printWakeDormantLabeledResult(res.data);
      } catch (err: any) {
        const msg =
          err?.response?.data?.error ?? err.message ?? 'Unknown error';
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
