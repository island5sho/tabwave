import { Command } from 'commander';
import axios from 'axios';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createLockCommand(): Command {
  const cmd = new Command('lock');

  cmd
    .description('Lock or unlock a session to prevent modifications')
    .argument('<sessionId>', 'ID of the session to lock or unlock')
    .option('--unlock', 'Unlock the session instead of locking it')
    .action(async (sessionId: string, options: { unlock?: boolean }) => {
      const action = options.unlock ? 'unlock' : 'lock';

      try {
        const res = await axios.patch(
          `${BASE_URL}/sessions/${sessionId}/lock`,
          { locked: !options.unlock }
        );

        if (res.status === 200) {
          const state = options.unlock ? 'unlocked' : 'locked';
          console.log(`Session "${res.data.name}" is now ${state}.`);
        } else {
          console.error(`Unexpected response: ${res.status}`);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Session "${sessionId}" is already ${action}ed.`);
        } else {
          console.error(`Failed to ${action} session: ${err.message}`);
        }
        process.exit(1);
      }
    });

  return cmd;
}
