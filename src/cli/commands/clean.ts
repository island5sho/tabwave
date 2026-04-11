import { Command } from 'commander';
import axios from 'axios';

const DEFAULT_HOST = 'http://localhost:3000';

export interface CleanOptions {
  olderThan?: number;
  archived?: boolean;
  dryRun?: boolean;
  host?: string;
}

export function createCleanCommand(): Command {
  const cmd = new Command('clean');

  cmd
    .description('Remove stale or archived sessions from the store')
    .option('--older-than <days>', 'Remove sessions not updated in N days', parseInt)
    .option('--archived', 'Remove only archived sessions')
    .option('--dry-run', 'Preview what would be removed without deleting')
    .option('--host <url>', 'Server host', DEFAULT_HOST)
    .action(async (opts: CleanOptions) => {
      const host = opts.host ?? DEFAULT_HOST;

      try {
        const params: Record<string, string | boolean> = {};
        if (opts.olderThan !== undefined) params.olderThan = opts.olderThan;
        if (opts.archived) params.archived = true;
        if (opts.dryRun) params.dryRun = true;

        const response = await axios.post(`${host}/sessions/clean`, params);
        const { removed, previewed } = response.data as { removed: string[]; previewed: string[] };

        const list = opts.dryRun ? previewed : removed;
        const verb = opts.dryRun ? 'Would remove' : 'Removed';

        if (list.length === 0) {
          console.log('No sessions matched the clean criteria.');
        } else {
          console.log(`${verb} ${list.length} session(s):`);
          list.forEach((id: string) => console.log(`  - ${id}`));
        }
      } catch (err: any) {
        console.error('Clean failed:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });

  return cmd;
}
