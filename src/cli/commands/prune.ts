import { Command } from 'commander';
import axios from 'axios';
import { TabSession } from '../../types/session';

const DEFAULT_PORT = 3000;

export interface PruneOptions {
  days?: number;
  dryRun?: boolean;
  port?: number;
}

export function isStale(session: TabSession, thresholdDays: number): boolean {
  const cutoff = Date.now() - thresholdDays * 24 * 60 * 60 * 1000;
  const updated = new Date(session.updatedAt).getTime();
  return updated < cutoff;
}

export function createPruneCommand(): Command {
  const cmd = new Command('prune');

  cmd
    .description('Remove sessions that have not been updated within a given number of days')
    .option('-d, --days <number>', 'Stale threshold in days', '30')
    .option('--dry-run', 'List sessions that would be removed without deleting them', false)
    .option('-p, --port <number>', 'Server port', String(DEFAULT_PORT))
    .action(async (opts: { days: string; dryRun: boolean; port: string }) => {
      const port = parseInt(opts.port, 10);
      const days = parseInt(opts.days, 10);
      const base = `http://localhost:${port}`;

      let sessions: TabSession[];
      try {
        const res = await axios.get<TabSession[]>(`${base}/sessions`);
        sessions = res.data;
      } catch {
        console.error('Failed to fetch sessions from server.');
        process.exit(1);
      }

      const stale = sessions.filter((s) => isStale(s, days));

      if (stale.length === 0) {
        console.log('No stale sessions found.');
        return;
      }

      if (opts.dryRun) {
        console.log(`Would remove ${stale.length} session(s):`);
        stale.forEach((s) => console.log(`  - ${s.id}  ${s.name}`));
        return;
      }

      let removed = 0;
      for (const session of stale) {
        try {
          await axios.delete(`${base}/sessions/${session.id}`);
          console.log(`Removed: ${session.id}  ${session.name}`);
          removed++;
        } catch {
          console.error(`Failed to remove session: ${session.id}`);
        }
      }

      console.log(`\nPruned ${removed} session(s).`);
    });

  return cmd;
}
