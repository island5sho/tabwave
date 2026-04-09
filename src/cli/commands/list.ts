import axios from 'axios';
import chalk from 'chalk';
import { Session } from '../../types/session';
import { summarizeSession } from '../../storage/session-store-helpers';

export interface ListOptions {
  host?: string;
  port?: number;
  verbose?: boolean;
}

export async function listSessions(options: ListOptions = {}): Promise<void> {
  const host = options.host ?? 'localhost';
  const port = options.port ?? 3000;
  const baseUrl = `http://${host}:${port}`;

  let sessions: Session[];

  try {
    const response = await axios.get<Session[]>(`${baseUrl}/sessions`);
    sessions = response.data;
  } catch (err: any) {
    console.error(chalk.red('Failed to fetch sessions from server.'));
    if (err?.message) console.error(chalk.red(err.message));
    process.exit(1);
  }

  if (sessions.length === 0) {
    console.log(chalk.yellow('No sessions found.'));
    return;
  }

  console.log(chalk.bold(`\nFound ${sessions.length} session(s):\n`));

  for (const session of sessions) {
    const summary = summarizeSession(session);
    console.log(chalk.cyan(`  ID:      `) + session.id);
    console.log(chalk.cyan(`  Device:  `) + session.deviceName);
    console.log(chalk.cyan(`  Tabs:    `) + summary.tabCount);
    console.log(chalk.cyan(`  Updated: `) + new Date(session.updatedAt).toLocaleString());

    if (options.verbose) {
      for (const tab of session.tabs) {
        console.log(chalk.gray(`    - [${tab.title}] ${tab.url}`));
      }
    }

    console.log();
  }
}
