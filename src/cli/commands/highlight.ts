import axios from 'axios';
import { Command } from 'commander';

export function printHighlight(tab: { url: string; title: string }, sessionId: string): void {
  console.log(`[${sessionId}] ★ ${tab.title}`);
  console.log(`    ${tab.url}`);
}

export function createHighlightCommand(): Command {
  const cmd = new Command('highlight');

  cmd
    .description('Mark a tab in a session as highlighted')
    .argument('<sessionId>', 'Session ID')
    .argument('<tabIndex>', 'Zero-based index of the tab to highlight')
    .option('--port <port>', 'Server port', '3000')
    .action(async (sessionId: string, tabIndex: string, options: { port: string }) => {
      const index = parseInt(tabIndex, 10);
      if (isNaN(index) || index < 0) {
        console.error('Invalid tab index');
        process.exit(1);
      }

      try {
        const res = await axios.post(
          `http://localhost:${options.port}/sessions/${sessionId}/highlight`,
          { tabIndex: index }
        );
        const { tab } = res.data;
        printHighlight(tab, sessionId);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
