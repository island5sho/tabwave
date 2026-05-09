import axios from 'axios';
import { Command } from 'commander';

interface HighlightedTab {
  url: string;
  title: string;
  highlighted?: boolean;
}

export function printHighlightedTabs(sessionId: string, tabs: HighlightedTab[]): void {
  const highlighted = tabs.filter((t) => t.highlighted);
  if (highlighted.length === 0) {
    console.log(`No highlighted tabs in session "${sessionId}".`);
    return;
  }
  console.log(`Highlighted tabs in "${sessionId}" (${highlighted.length}):`);
  highlighted.forEach((tab, i) => {
    console.log(`  ${i + 1}. ${tab.title}`);
    console.log(`     ${tab.url}`);
  });
}

export function createHighlightsCommand(): Command {
  const cmd = new Command('highlights');

  cmd
    .description('List all highlighted tabs in a session')
    .argument('<sessionId>', 'Session ID')
    .option('--port <port>', 'Server port', '3000')
    .option('--json', 'Output as JSON')
    .action(async (sessionId: string, options: { port: string; json?: boolean }) => {
      try {
        const res = await axios.get(
          `http://localhost:${options.port}/sessions/${sessionId}`
        );
        const session = res.data;
        const highlighted = (session.tabs as HighlightedTab[]).filter((t) => t.highlighted);

        if (options.json) {
          console.log(JSON.stringify(highlighted, null, 2));
        } else {
          printHighlightedTabs(sessionId, session.tabs);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
