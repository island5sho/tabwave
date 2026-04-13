import { Command } from 'commander';
import axios from 'axios';
import { Session } from '../../types/session';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createLabelCommand(): Command {
  const cmd = new Command('label');

  cmd
    .description('Add, remove, or list labels on a session')
    .argument('<sessionId>', 'Session ID to label')
    .option('-a, --add <labels...>', 'Labels to add')
    .option('-r, --remove <labels...>', 'Labels to remove')
    .option('-l, --list', 'List current labels')
    .action(async (sessionId: string, opts) => {
      try {
        if (opts.list) {
          const res = await axios.get<Session>(`${BASE_URL}/sessions/${sessionId}`);
          const labels: string[] = res.data.labels ?? [];
          if (labels.length === 0) {
            console.log('No labels set.');
          } else {
            console.log('Labels:', labels.join(', '));
          }
          return;
        }

        if (!opts.add && !opts.remove) {
          console.error('Specify --add, --remove, or --list.');
          process.exit(1);
        }

        const res = await axios.patch<Session>(`${BASE_URL}/sessions/${sessionId}/labels`, {
          add: opts.add ?? [],
          remove: opts.remove ?? [],
        });

        const updated: string[] = res.data.labels ?? [];
        console.log(`Labels updated. Current labels: ${updated.length ? updated.join(', ') : '(none)'}`);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error('Error:', msg);
        process.exit(1);
      }
    });

  return cmd;
}
