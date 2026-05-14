import axios from 'axios';
import { Command } from 'commander';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createPauseCommand(): Command {
  const cmd = new Command('pause');

  cmd
    .description('Pause a session, preventing it from being synced or modified')
    .argument('<id>', 'Session ID to pause')
    .option('--port <port>', 'Server port', '3000')
    .action(async (id: string, options: { port: string }) => {
      const baseUrl = `http://localhost:${options.port}`;
      try {
        const res = await axios.patch(`${baseUrl}/sessions/${id}/pause`);
        if (res.status === 200) {
          console.log(`Session "${res.data.name ?? id}" has been paused.`);
        } else {
          console.error(`Unexpected response: ${res.status}`);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${id}" not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Session "${id}" is already paused.`);
        } else {
          console.error('Failed to pause session:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
