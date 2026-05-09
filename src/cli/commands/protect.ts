import axios from 'axios';
import { Command } from 'commander';

export function createProtectCommand(): Command {
  const cmd = new Command('protect');

  cmd
    .description('Protect a session from deletion or modification')
    .argument('<sessionId>', 'ID of the session to protect')
    .option('--unprotect', 'Remove protection from the session')
    .option('--host <host>', 'Server host', 'http://localhost:3000')
    .action(async (sessionId: string, options: { unprotect?: boolean; host: string }) => {
      const action = options.unprotect ? 'unprotect' : 'protect';
      try {
        const res = await axios.patch(`${options.host}/sessions/${sessionId}/protect`, {
          protected: !options.unprotect,
        });
        const session = res.data;
        const state = session.protected ? 'protected' : 'unprotected';
        console.log(`Session "${session.name}" is now ${state}.`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error(`Failed to ${action} session:`, err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
