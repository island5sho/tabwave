import axios from 'axios';
import { Command } from 'commander';

export function createDetachCommand(): Command {
  const cmd = new Command('detach');

  cmd
    .description('Detach a tab from a session by index, creating a new standalone session')
    .argument('<sessionId>', 'ID of the session to detach from')
    .argument('<tabIndex>', 'Zero-based index of the tab to detach')
    .option('-n, --name <name>', 'Name for the new detached session')
    .option('-H, --host <host>', 'Server host', 'localhost')
    .option('-p, --port <port>', 'Server port', '3000')
    .action(async (sessionId: string, tabIndexStr: string, opts) => {
      const tabIndex = parseInt(tabIndexStr, 10);
      if (isNaN(tabIndex) || tabIndex < 0) {
        console.error('Tab index must be a non-negative integer.');
        process.exit(1);
      }

      const base = `http://${opts.host}:${opts.port}`;

      try {
        const res = await axios.post(`${base}/sessions/${sessionId}/detach`, {
          tabIndex,
          name: opts.name,
        });

        const { newSessionId, tab } = res.data;
        console.log(`Detached tab "${tab.title}" into new session: ${newSessionId}`);
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Failed to detach tab: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
