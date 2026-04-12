import { Command } from 'commander';
import axios from 'axios';
import { TabSession } from '../../types/session';

export function createGroupCommand(): Command {
  const cmd = new Command('group');

  cmd
    .description('Group sessions by a field (tag, device, or date)')
    .argument('<by>', 'Field to group by: tag | device | date')
    .option('-p, --port <port>', 'Server port', '3000')
    .action(async (by: string, options: { port: string }) => {
      const validFields = ['tag', 'device', 'date'];
      if (!validFields.includes(by)) {
        console.error(`Invalid group field: "${by}". Must be one of: ${validFields.join(', ')}`);
        process.exit(1);
      }

      try {
        const res = await axios.get(`http://localhost:${options.port}/sessions`);
        const sessions: TabSession[] = res.data;

        if (!sessions.length) {
          console.log('No sessions found.');
          return;
        }

        const grouped = groupSessions(sessions, by as 'tag' | 'device' | 'date');
        printGrouped(grouped);
      } catch {
        console.error('Failed to connect to tabwave server.');
        process.exit(1);
      }
    });

  return cmd;
}

export function groupSessions(
  sessions: TabSession[],
  by: 'tag' | 'device' | 'date'
): Record<string, TabSession[]> {
  const result: Record<string, TabSession[]> = {};

  for (const session of sessions) {
    let keys: string[] = [];

    if (by === 'tag') {
      keys = session.tags && session.tags.length > 0 ? session.tags : ['(untagged)'];
    } else if (by === 'device') {
      keys = [session.device || '(unknown)'];
    } else if (by === 'date') {
      keys = [new Date(session.updatedAt).toISOString().slice(0, 10)];
    }

    for (const key of keys) {
      if (!result[key]) result[key] = [];
      result[key].push(session);
    }
  }

  return result;
}

function printGrouped(grouped: Record<string, TabSession[]>): void {
  for (const [key, sessions] of Object.entries(grouped).sort()) {
    console.log(`\n[${key}] (${sessions.length} session${sessions.length !== 1 ? 's' : ''})`);
    for (const s of sessions) {
      console.log(`  - ${s.id}: ${s.name} (${s.tabs.length} tab${s.tabs.length !== 1 ? 's' : ''})`);
    }
  }
}
