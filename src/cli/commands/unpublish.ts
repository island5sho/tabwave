import axios from 'axios';
import { Command } from 'commander';

export function createUnpublishCommand(): Command {
  const cmd = new Command('unpublish');

  cmd
    .description('Revoke a shared session link by invalidating its share token')
    .argument('<sessionId>', 'ID of the session to unpublish')
    .option('--host <host>', 'Server host', 'http://localhost:3000')
    .action(async (sessionId: string, options: { host: string }) => {
      try {
        const res = await axios.delete(
          `${options.host}/sessions/${sessionId}/share`
        );

        if (res.status === 200) {
          console.log(`Share link for session "${sessionId}" has been revoked.`);
        } else {
          console.error(`Unexpected response: ${res.status}`);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Session "${sessionId}" has no active share link.`);
        } else {
          console.error(
            'Failed to unpublish session:',
            err.response?.data?.error ?? err.message
          );
        }
        process.exit(1);
      }
    });

  return cmd;
}
