import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createCloneCommand(): Command {
  const cmd = new Command('clone');

  cmd
    .description('Clone a session from a remote server into the local server')
    .argument('<remoteUrl>', 'Base URL of the remote tabwave server')
    .argument('<sessionId>', 'ID of the session to clone')
    .option('-n, --name <name>', 'Override the cloned session name')
    .option('--no-tags', 'Strip tags from the cloned session')
    .action(async (remoteUrl: string, sessionId: string, opts) => {
      try {
        const fetchRes = await axios.get<TabSession>(
          `${remoteUrl.replace(/\/$/, '')}/sessions/${sessionId}`
        );

        if (fetchRes.status !== 200) {
          console.error(`Failed to fetch session from remote: ${fetchRes.status}`);
          process.exit(1);
        }

        const source = fetchRes.data;

        const cloned: Omit<TabSession, 'id'> = {
          name: opts.name ?? `${source.name} (clone)`,
          tabs: source.tabs,
          tags: opts.tags === false ? [] : source.tags ?? [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const postRes = await axios.post<TabSession>(
          `${BASE_URL}/sessions`,
          cloned
        );

        if (postRes.status === 201) {
          console.log(`Session cloned successfully.`);
          console.log(`  ID   : ${postRes.data.id}`);
          console.log(`  Name : ${postRes.data.name}`);
          console.log(`  Tabs : ${postRes.data.tabs.length}`);
        } else {
          console.error(`Unexpected response when saving clone: ${postRes.status}`);
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Clone failed: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
