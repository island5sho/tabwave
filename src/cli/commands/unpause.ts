import { Command } from 'commander';
import axios from 'axios';

export function createUnpauseCommand(): Command {
  const cmd = new Command('unpause');

  cmd
    .description('Unpause a paused session, resuming normal sync and access')
    .argument('<sessionId>', 'ID of the session to unpause')
    .option('--port <port>', 'Server port', '3000')
    .action(async (sessionId: string, options: { port: string }) => {
      const base = `http://localhost:${options.port}`;

      try {
        const res = await axios.patch(`${base}/sessions/${sessionId}/unpause`);

        if (res.status === 200) {
          console.log(`Session "${sessionId}" has been unpaused.`);
        } else {
          console.error(`Unexpected response: ${res.status}`);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Session "${sessionId}" is not paused.`);
        } else {
          console.error(`Failed to unpause session: ${err.message}`);
        }
        process.exit(1);
      }
    });

  return cmd;
}
