import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';
import { SessionSummary } from '../../types/session';

const DEFAULT_INTERVAL_MS = 3000;

function formatWatchLine(session: SessionSummary): string {
  const pinned = session.pinned ? chalk.yellow(' [pinned]') : '';
  const archived = session.archived ? chalk.gray(' [archived]') : '';
  const tags = session.tags?.length ? chalk.cyan(` [${session.tags.join(', ')}]`) : '';
  return `  ${chalk.bold(session.name)} — ${session.tabCount} tab(s)${pinned}${archived}${tags}`;
}

export function createWatchCommand(): Command {
  const cmd = new Command('watch');

  cmd
    .description('Watch for session changes in real time')
    .option('-p, --port <port>', 'Server port', '3000')
    .option('-i, --interval <ms>', 'Poll interval in milliseconds', String(DEFAULT_INTERVAL_MS))
    .action(async (options) => {
      const port = parseInt(options.port, 10);
      const interval = parseInt(options.interval, 10);
      const baseUrl = `http://localhost:${port}`;

      console.log(chalk.blue(`Watching sessions on port ${port} (every ${interval}ms)...`));
      console.log(chalk.gray('Press Ctrl+C to stop.\n'));

      let previousSnapshot: string = '';

      const poll = async () => {
        try {
          const res = await axios.get<SessionSummary[]>(`${baseUrl}/sessions`);
          const sessions = res.data;
          const snapshot = JSON.stringify(sessions);

          if (snapshot !== previousSnapshot) {
            console.clear();
            console.log(chalk.blue.bold(`[${new Date().toLocaleTimeString()}] Sessions (${sessions.length}):`));
            if (sessions.length === 0) {
              console.log(chalk.gray('  No sessions found.'));
            } else {
              sessions.forEach((s) => console.log(formatWatchLine(s)));
            }
            previousSnapshot = snapshot;
          }
        } catch {
          console.error(chalk.red('Could not reach server. Retrying...'));
        }
      };

      await poll();
      const timer = setInterval(poll, interval);

      process.on('SIGINT', () => {
        clearInterval(timer);
        console.log(chalk.gray('\nWatch stopped.'));
        process.exit(0);
      });
    });

  return cmd;
}
