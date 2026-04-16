import axios from 'axios';
import { Command } from 'commander';

export function createReorderCommand(): Command {
  const cmd = new Command('reorder');

  cmd
    .description('Reorder tabs within a session by moving a tab to a new index')
    .argument('<sessionId>', 'Session ID')
    .argument('<fromIndex>', 'Current tab index (0-based)')
    .argument('<toIndex>', 'Target tab index (0-based)')
    .option('--port <port>', 'Server port', '3000')
    .action(async (sessionId: string, fromArg: string, toArg: string, opts) => {
      const from = parseInt(fromArg, 10);
      const to = parseInt(toArg, 10);

      if (isNaN(from) || isNaN(to)) {
        console.error('Error: fromIndex and toIndex must be integers');
        process.exit(1);
      }

      try {
        const res = await axios.post(
          `http://localhost:${opts.port}/sessions/${sessionId}/reorder`,
          { from, to }
        );
        const { tabs } = res.data;
        console.log(`Tabs reordered in session "${sessionId}":`);
        tabs.forEach((tab: { url: string; title?: string }, i: number) => {
          console.log(`  [${i}] ${tab.title ?? tab.url}`);
        });
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
