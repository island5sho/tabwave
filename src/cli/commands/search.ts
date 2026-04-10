import { Command } from 'commander';
import axios from 'axios';
import { TabSession } from '../../types/session';
import { printSession } from './list';

interface SearchOptions {
  tag?: string;
  url?: string;
  title?: string;
  port?: string;
}

export function createSearchCommand(): Command {
  const cmd = new Command('search');

  cmd
    .description('Search sessions by title, URL, or tag')
    .option('-t, --title <query>', 'filter by tab title (case-insensitive)')
    .option('-u, --url <query>', 'filter by tab URL (case-insensitive)')
    .option('--tag <tag>', 'filter by session tag')
    .option('-p, --port <port>', 'server port', '3000')
    .action(async (options: SearchOptions) => {
      const { title, url, tag, port } = options;

      if (!title && !url && !tag) {
        console.error('Error: provide at least one of --title, --url, or --tag');
        process.exit(1);
      }

      try {
        const res = await axios.get<TabSession[]>(
          `http://localhost:${port}/sessions`
        );
        const sessions: TabSession[] = res.data;

        const results = sessions.filter((session) => {
          if (tag && !(session.tags ?? []).includes(tag)) return false;

          if (title || url) {
            const titleLower = title?.toLowerCase();
            const urlLower = url?.toLowerCase();
            const matched = session.tabs.some((tab) => {
              const tabTitle = tab.title.toLowerCase();
              const tabUrl = tab.url.toLowerCase();
              if (titleLower && !tabTitle.includes(titleLower)) return false;
              if (urlLower && !tabUrl.includes(urlLower)) return false;
              return true;
            });
            if (!matched) return false;
          }

          return true;
        });

        if (results.length === 0) {
          console.log('No sessions matched your search.');
          return;
        }

        console.log(`Found ${results.length} session(s):\n`);
        results.forEach((s) => printSession(s));
      } catch (err: any) {
        console.error(
          'Error connecting to tabwave server:',
          err.message ?? err
        );
        process.exit(1);
      }
    });

  return cmd;
}
