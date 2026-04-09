import { Command } from 'commander';
import axios from 'axios';
import { Session } from '../../types/session';

const BASE_URL = process.env.TABWAVE_SERVER || 'http://localhost:3000';

export function createTagCommand(): Command {
  const cmd = new Command('tag');

  cmd
    .description('Add or remove tags on a session')
    .argument('<session-id>', 'ID of the session to tag')
    .option('-a, --add <tags...>', 'Tags to add')
    .option('-r, --remove <tags...>', 'Tags to remove')
    .option('--list', 'List current tags for the session')
    .action(async (sessionId: string, options) => {
      try {
        const { data: session } = await axios.get<Session>(
          `${BASE_URL}/sessions/${sessionId}`
        );

        if (options.list) {
          const tags = session.tags ?? [];
          if (tags.length === 0) {
            console.log(`Session "${session.name}" has no tags.`);
          } else {
            console.log(`Tags for "${session.name}": ${tags.join(', ')}`);
          }
          return;
        }

        let tags: string[] = session.tags ?? [];

        if (options.add) {
          const toAdd: string[] = options.add;
          tags = Array.from(new Set([...tags, ...toAdd]));
        }

        if (options.remove) {
          const toRemove: string[] = options.remove;
          tags = tags.filter((t) => !toRemove.includes(t));
        }

        const { data: updated } = await axios.patch<Session>(
          `${BASE_URL}/sessions/${sessionId}`,
          { tags }
        );

        console.log(
          `Updated tags for "${updated.name}": ${
            updated.tags && updated.tags.length > 0
              ? updated.tags.join(', ')
              : '(none)'
          }`
        );
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
