import axios from 'axios';
import { Command } from 'commander';

export function createDeactivateCommand(): Command {
  const cmd = new Command('deactivate');

  cmd
    .description('Mark a session as inactive')
    .argument('<sessionId>', 'ID of the session to deactivate')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (sessionId: string, options: { host: string; port: string }) => {
      const base = `http://${options.host}:${options.port}`;

      try {
        const res = await axios.patch(`${base}/sessions/${sessionId}/deactivate`);

        if (res.status === 200) {
          console.log(`Session "${res.data.name ?? sessionId}" has been deactivated.`);
        } else {
          console.error('Unexpected response:', res.status);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session not found: ${sessionId}`);
        } else if (err.response?.status === 409) {
          console.error(`Session is already inactive: ${sessionId}`);
        } else {
          console.error('Failed to deactivate session:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
