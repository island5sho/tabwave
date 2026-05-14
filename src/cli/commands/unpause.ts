import axios from 'axios';
import { Command } from 'commander';

export function createUnpauseCommand(): Command {
  const cmd = new Command('unpause');

  cmd
    .description('Resume a paused session, making it active again')
    .argument('<sessionId>', 'ID of the session to unpause')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (sessionId: string, options: { host: string; port: string }) => {
      const base = `http://${options.host}:${options.port}`;

      try {
        const res = await axios.post(`${base}/sessions/${sessionId}/unpause`);
        const session = res.data;
        console.log(`Session "${session.name}" (${sessionId}) has been unpaused.`);
        console.log(`Status: ${session.status ?? 'active'}`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session not found: ${sessionId}`);
        } else if (err.response?.status === 409) {
          console.error(`Session is not paused: ${sessionId}`);
        } else {
          console.error('Failed to unpause session:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
