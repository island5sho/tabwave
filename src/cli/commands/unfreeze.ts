import axios from 'axios';
import { Command } from 'commander';

export function createUnfreezeCommand(): Command {
  const cmd = new Command('unfreeze');

  cmd
    .description('Unfreeze a frozen session, making it active again')
    .argument('<sessionId>', 'ID of the session to unfreeze')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (sessionId: string, options: { host: string; port: string }) => {
      const base = `http://${options.host}:${options.port}`;

      try {
        const res = await axios.post(`${base}/sessions/${sessionId}/unfreeze`);

        if (res.status === 200) {
          console.log(`Session "${sessionId}" has been unfrozen.`);
        } else {
          console.error(`Unexpected response: ${res.status}`);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Session "${sessionId}" is not frozen.`);
        } else {
          console.error('Failed to unfreeze session:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
