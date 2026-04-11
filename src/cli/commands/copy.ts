import { Command } from 'commander';
import axios from 'axios';
import { SessionTab } from '../../types/session';

export function createCopyCommand(): Command {
  const cmd = new Command('copy');

  cmd
    .description('Copy specific tabs from one session to another')
    .argument('<source>', 'Source session ID or name')
    .argument('<target>', 'Target session ID or name')
    .option('-i, --indices <indices>', 'Comma-separated tab indices to copy (default: all)')
    .option('-p, --port <port>', 'Server port', '3000')
    .action(async (source: string, target: string, options) => {
      const base = `http://localhost:${options.port}`;

      try {
        const indices: number[] | undefined = options.indices
          ? options.indices.split(',').map((i: string) => parseInt(i.trim(), 10))
          : undefined;

        const res = await axios.post(`${base}/sessions/copy`, {
          source,
          target,
          indices,
        });

        const { copied } = res.data as { copied: number };
        console.log(`Copied ${copied} tab(s) from "${source}" to "${target}".`);
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error copying tabs: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
