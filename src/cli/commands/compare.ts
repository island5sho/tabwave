import axios from 'axios';
import { Command } from 'commander';
import { diffSessions, hasDiff } from '../../sync/session-diff';
import { TabSession } from '../../types/session';

export function printComparison(a: TabSession, b: TabSession): void {
  const diff = diffSessions(a, b);

  if (!hasDiff(diff)) {
    console.log('Sessions are identical.');
    return;
  }

  if (diff.added.length > 0) {
    console.log(`\nTabs in "${b.name}" not in "${a.name}":`);
    for (const tab of diff.added) {
      console.log(`  + [${tab.title}] ${tab.url}`);
    }
  }

  if (diff.removed.length > 0) {
    console.log(`\nTabs in "${a.name}" not in "${b.name}":`);
    for (const tab of diff.removed) {
      console.log(`  - [${tab.title}] ${tab.url}`);
    }
  }

  if (diff.modified.length > 0) {
    console.log(`\nModified tabs: of diff.modified) {
      console.log(`  ~ [${tab.title}] ${tab.url}`);
    }
  }

  console.log(`\nSummary: +${diff.added.length} added, -${diff.removed.length} removed, ~${diff.modified.length} modified`);
}

export function createCompareCommand(baseUrl: string): Command {
  const cmd = new Command('compare');
  cmd
    .description('Compare two sessions and show their differences')
    .argument('<sessionA>', 'first session name or ID')
    .argument('<sessionB>', 'second session name or ID')
    .action(async (sessionA: string, sessionB: string) => {
      try {
        const [resA, resB] = await Promise.all([
          axios.get(`${baseUrl}/sessions/${encodeURIComponent(sessionA)}`),
          axios.get(`${baseUrl}/sessions/${encodeURIComponent(sessionB)}`),
        ]);
        printComparison(resA.data, resB.data);
      } catch (err: any) {
        const msg = err?.response?.data?.error || err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
