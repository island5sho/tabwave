import axios from 'axios';
import { Command } from 'commander';

export function createWakeCommand(): Command {
  const cmd = new Command('wake');

  cmd
    .description('Wake a frozen or dormant session, making it active again')
    .argument('<sessionId>', 'ID of the session to wake')
    .option('--host <host>', 'Server host', 'http://localhost:3000')
    .action(async (sessionId: string, options: { host: string }) => {
      try {
        const res = await axios.post(
          `${options.host}/sessions/${sessionId}/wake`
        );

        if (res.status === 200) {
          const session = res.data;
          console.log(`Session "${session.name}" (${sessionId}) has been woken.`);
          if (session.frozenAt) {
            console.log(`  Previously frozen at: ${new Date(session.frozenAt).toLocaleString()}`);
          }
          if (session.dormantSince) {
            console.log(`  Previously dormant since: ${new Date(session.dormantSince).toLocaleString()}`);
          }
        } else {
          console.error(`Unexpected response: ${res.status}`);
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else if (err.response?.status === 409) {
          console.error(`Session "${sessionId}" is already active.`);
        } else {
          console.error('Failed to wake session:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
