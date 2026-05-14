import axios from 'axios';
import { Command } from 'commander';

const DEFAULT_HOST = 'http://localhost:3000';

export interface FlushOptions {
  host?: string;
  force?: boolean;
  archived?: boolean;
  frozen?: boolean;
}

export function createFlushCommand(): Command {
  const cmd = new Command('flush');

  cmd
    .description('Remove all sessions from the store, optionally filtering by state')
    .option('--host <host>', 'Server host', DEFAULT_HOST)
    .option('-f, --force', 'Skip confirmation prompt')
    .option('--archived', 'Flush only archived sessions')
    .option('--frozen', 'Flush only frozen sessions')
    .action(async (opts: FlushOptions) => {
      const host = opts.host ?? DEFAULT_HOST;

      if (!opts.force) {
        const filter = opts.archived
          ? 'archived'
          : opts.frozen
          ? 'frozen'
          : 'all';
        process.stdout.write(
          `This will permanently delete ${filter} sessions. Pass --force to confirm.\n`
        );
        process.exit(1);
      }

      const params: Record<string, string> = {};
      if (opts.archived) params['filter'] = 'archived';
      else if (opts.frozen) params['filter'] = 'frozen';

      try {
        const res = await axios.delete(`${host}/sessions/flush`, { params });
        const { removed } = res.data as { removed: number };
        console.log(`Flushed ${removed} session(s).`);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Flush failed: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
