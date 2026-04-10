import { Command } from 'commander';
import axios from 'axios';
import { TabSession } from '../../types/session';

const DEFAULT_SERVER = 'http://localhost:3000';

export interface SessionHistoryEntry {
  sessionId: string;
  name: string;
  timestamp: string;
  tabCount: number;
  action: 'push' | 'pull' | 'merge' | 'import' | 'rename' | 'delete';
}

function formatHistoryEntry(entry: SessionHistoryEntry): string {
  const date = new Date(entry.timestamp).toLocaleString();
  const action = entry.action.toUpperCase().padEnd(7);
  return `[${date}] ${action}  ${entry.name} (${entry.tabCount} tabs)  id:${entry.sessionId.slice(0, 8)}`;
}

export function createHistoryCommand(): Command {
  const cmd = new Command('history');

  cmd
    .description('Show recent session activity history')
    .option('-n, --limit <number>', 'Number of history entries to show', '20')
    .option('-s, --session <id>', 'Filter history by session ID')
    .option('--server <url>', 'Server URL', DEFAULT_SERVER)
    .action(async (options) => {
      const limit = parseInt(options.limit, 10);
      const server: string = options.server;

      try {
        const params: Record<string, string | number> = { limit };
        if (options.session) {
          params.sessionId = options.session;
        }

        const response = await axios.get<SessionHistoryEntry[]>(
          `${server}/sessions/history`,
          { params }
        );

        const entries = response.data;

        if (entries.length === 0) {
          console.log('No history entries found.');
          return;
        }

        console.log(`Recent session history (${entries.length} entries):\n`);
        for (const entry of entries) {
          console.log(formatHistoryEntry(entry));
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error('History endpoint not available on this server.');
        } else {
          console.error('Failed to fetch history:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
