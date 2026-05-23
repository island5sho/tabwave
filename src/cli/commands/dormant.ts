import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

const SERVER = 'http://localhost:3000';

export function printDormantSession(session: TabSession): void {
  const lastActive = session.updatedAt
    ? new Date(session.updatedAt).toLocaleString()
    : 'unknown';
  const tabCount = session.tabs?.length ?? 0;
  console.log(`  [${session.id}] ${session.name} — ${tabCount} tab(s), last active: ${lastActive}`);
}

export function createDormantCommand(): Command {
  const cmd = new Command('dormant');

  cmd
    .description('List sessions that have been inactive for a given number of days')
    .option('-d, --days <number>', 'Minimum days of inactivity', '7')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const days = parseInt(opts.days, 10);
      if (isNaN(days) || days < 0) {
        console.error('Error: --days must be a non-negative integer.');
        process.exit(1);
      }

      try {
        const res = await axios.get(`${SERVER}/sessions/dormant`, {
          params: { days },
        });

        const sessions: TabSession[] = res.data;

        if (opts.json) {
          console.log(JSON.stringify(sessions, null, 2));
          return;
        }

        if (sessions.length === 0) {
          console.log(`No sessions inactive for more than ${days} day(s).`);
          return;
        }

        console.log(`Sessions inactive for more than ${days} day(s):`);
        sessions.forEach(printDormantSession);
      } catch (err: any) {
        console.error('Error fetching dormant sessions:', err.message);
        process.exit(1);
      }
    });

  return cmd;
}
