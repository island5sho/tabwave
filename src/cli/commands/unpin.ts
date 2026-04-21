import axios from 'axios';
import { Command } from 'commander';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createUnpinCommand(): Command {
  const cmd = new Command('unpin');

  cmd
    .description('Remove the pinned flag from a session')
    .argument('<id>', 'Session ID to unpin')
    .option('--server <url>', 'Server URL', BASE_URL)
    .action(async (id: string, options: { server: string }) => {
      try {
        const res = await axios.patch(`${options.server}/sessions/${id}/unpin`);
        if (res.status === 200) {
          console.log(`Session "${res.data.name}" unpinned.`);
        } else {
          console.error('Unexpected response:', res.status);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session not found: ${id}`);
        } else if (err.response?.status === 400) {
          console.error(`Session is not pinned: ${id}`);
        } else {
          console.error('Failed to unpin session:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
