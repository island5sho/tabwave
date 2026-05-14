import axios from 'axios';
import { Command } from 'commander';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createUnarchiveCommand(): Command {
  const cmd = new Command('unarchive');

  cmd
    .description('Restore an archived session back to active')
    .argument('<sessionId>', 'ID of the archived session to restore')
    .option('-s, --server <url>', 'Server URL', BASE_URL)
    .action(async (sessionId: string, options: { server: string }) => {
      try {
        const res = await axios.post(
          `${options.server}/sessions/${sessionId}/unarchive`
        );

        if (res.status === 200) {
          console.log(`Session "${res.data.name}" has been unarchived.`);
        } else {
          console.error('Unexpected response from server.');
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Session "${sessionId}" is not archived.`);
        } else {
          console.error(
            'Failed to unarchive session:',
            err.response?.data?.error ?? err.message
          );
        }
        process.exit(1);
      }
    });

  return cmd;
}
