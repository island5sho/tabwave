import { Command } from 'commander';
import axios from 'axios';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createPinCommand(): Command {
  const cmd = new Command('pin');

  cmd
    .description('Pin or unpin a session to keep it from being auto-archived or overwritten')
    .argument('<sessionId>', 'ID of the session to pin or unpin')
    .option('--unpin', 'Remove the pin from the session')
    .action(async (sessionId: string, options: { unpin?: boolean }) => {
      const pinned = !options.unpin;
      try {
        const response = await axios.patch(
          `${BASE_URL}/sessions/${sessionId}/pin`,
          { pinned }
        );

        if (response.status === 200) {
          const action = pinned ? 'pinned' : 'unpinned';
          console.log(`Session "${response.data.name}" has been ${action}.`);
        } else {
          console.error('Unexpected response from server.');
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error('Failed to update pin status:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
