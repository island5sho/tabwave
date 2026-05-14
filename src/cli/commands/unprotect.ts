import axios from 'axios';
import { Command } from 'commander';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createUnprotectCommand(): Command {
  const cmd = new Command('unprotect');

  cmd
    .description('Remove protection from a session, allowing it to be modified or deleted')
    .argument('<sessionId>', 'ID of the session to unprotect')
    .option('--force', 'Skip confirmation prompt')
    .action(async (sessionId: string, options: { force?: boolean }) => {
      try {
        const res = await axios.patch(`${BASE_URL}/sessions/${sessionId}/unprotect`);

        if (res.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
          process.exit(1);
        }

        const session = res.data;
        console.log(`Session "${session.name ?? sessionId}" is now unprotected.`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
          process.exit(1);
        }
        if (err.response?.status === 400) {
          console.error(`Session "${sessionId}" is not currently protected.`);
          process.exit(1);
        }
        console.error('Failed to unprotect session:', err.message);
        process.exit(1);
      }
    });

  return cmd;
}
