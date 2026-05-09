import axios from 'axios';
import { Command } from 'commander';
import { TabSession } from '../../types/session';

export function printInfo(session: TabSession): void {
  console.log(`ID:        ${session.id}`);
  console.log(`Name:      ${session.name}`);
  console.log(`Tabs:      ${session.tabs.length}`);
  console.log(`Created:   ${new Date(session.createdAt).toLocaleString()}`);
  console.log(`Updated:   ${new Date(session.updatedAt).toLocaleString()}`);

  if (session.tags && session.tags.length > 0) {
    console.log(`Tags:      ${session.tags.join(', ')}`);
  }

  if (session.pinned) {
    console.log(`Pinned:    yes`);
  }

  if (session.archived) {
    console.log(`Archived:  yes`);
  }

  if (session.locked) {
    console.log(`Locked:    yes`);
  }

  if (session.frozen) {
    console.log(`Frozen:    yes`);
  }

  if (session.note) {
    console.log(`Note:      ${session.note}`);
  }

  if (session.label) {
    console.log(`Label:     ${session.label}`);
  }

  console.log('\nTabs:');
  session.tabs.forEach((tab, i) => {
    console.log(`  [${i + 1}] ${tab.title || '(untitled)'} — ${tab.url}`);
  });
}

export function createInfoCommand(baseUrl: string): Command {
  const cmd = new Command('info');

  cmd
    .description('Show detailed information about a session')
    .argument('<id>', 'Session ID')
    .action(async (id: string) => {
      try {
        const res = await axios.get<TabSession>(`${baseUrl}/sessions/${id}`);
        printInfo(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${id}" not found.`);
        } else {
          console.error('Failed to fetch session info:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
