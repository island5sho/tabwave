import { Command } from 'commander';
import axios from 'axios';
import { TabSession } from '../../types/session';
import { printSession } from './list';

export interface FilterOptions {
  tag?: string;
  pinned?: boolean;
  archived?: boolean;
  minTabs?: number;
  maxTabs?: number;
}

export function filterSessions(
  sessions: TabSession[],
  options: FilterOptions
): TabSession[] {
  return sessions.filter((session) => {
    if (options.tag !== undefined) {
      const tags: string[] = (session as any).tags ?? [];
      if (!tags.includes(options.tag)) return false;
    }

    if (options.pinned !== undefined) {
      if (Boolean((session as any).pinned) !== options.pinned) return false;
    }

    if (options.archived !== undefined) {
      if (Boolean((session as any).archived) !== options.archived) return false;
    }

    if (options.minTabs !== undefined) {
      if (session.tabs.length < options.minTabs) return false;
    }

    if (options.maxTabs !== undefined) {
      if (session.tabs.length > options.maxTabs) return false;
    }

    return true;
  });
}

export function createFilterCommand(): Command {
  const cmd = new Command('filter');

  cmd
    .description('Filter and list sessions by criteria')
    .option('--tag <tag>', 'filter by tag')
    .option('--pinned', 'show only pinned sessions')
    .option('--archived', 'show only archived sessions')
    .option('--min-tabs <n>', 'minimum number of tabs', parseInt)
    .option('--max-tabs <n>', 'maximum number of tabs', parseInt)
    .option('--port <port>', 'server port', '3000')
    .action(async (opts) => {
      try {
        const port = opts.port;
        const res = await axios.get(`http://localhost:${port}/sessions`);
        const sessions: TabSession[] = res.data;

        const filtered = filterSessions(sessions, {
          tag: opts.tag,
          pinned: opts.pinned,
          archived: opts.archived,
          minTabs: opts.minTabs,
          maxTabs: opts.maxTabs,
        });

        if (filtered.length === 0) {
          console.log('No sessions match the given filters.');
          return;
        }

        filtered.forEach(printSession);
      } catch (err: any) {
        console.error('Failed to fetch sessions:', err.message);
        process.exit(1);
      }
    });

  return cmd;
}
