import { Command } from 'commander';
import axios from 'axios';
import { Session } from '../../types/session';

const DEFAULT_HOST = 'http://localhost:3000';

export function createDuplicateCommand(): Command {
  const cmd = new Command('duplicate');

  cmd
    .description('Duplicate an existing session under a new name')
    .argument('<sessionId>', 'ID of the session to duplicate')
    .argument('<newName>', 'Name for the duplicated session')
    .option('-h, --host <host>', 'Server host', DEFAULT_HOST)
    .action(async (sessionId: string, newName: string, options: { host: string }) => {
      try {
        const getRes = await axios.get<Session>(`${options.host}/sessions/${sessionId}`);
        const original = getRes.data;

        const duplicated: Session = {
          ...original,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: newName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: original.tags ? [...original.tags] : [],
          tabs: original.tabs.map(tab => ({ ...tab })),
        };

        const postRes = await axios.post<Session>(`${options.host}/sessions`, duplicated);
        console.log(`Session duplicated successfully.`);
        console.log(`New session ID: ${postRes.data.id}`);
        console.log(`Name: ${postRes.data.name}`);
        console.log(`Tabs copied: ${postRes.data.tabs.length}`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Error: Session '${sessionId}' not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Error: A session named '${newName}' already exists.`);
        } else {
          console.error(`Error duplicating session: ${err.message}`);
        }
        process.exit(1);
      }
    });

  return cmd;
}
