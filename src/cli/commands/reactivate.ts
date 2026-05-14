import axios from 'axios';
import { Command } from 'commander';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function createReactivateCommand(): Command {
  const cmd = new Command('reactivate');

  cmd
    .description('Reactivate all dormant (deactivated) sessions at once')
    .option('-t, --tag <tag>', 'Only reactivate sessions matching a specific tag')
    .option('--dry-run', 'Preview which sessions would be reactivated without applying changes')
    .action(async (opts) => {
      try {
        const listRes = await axios.get(`${BASE_URL}/sessions`);
        const sessions: any[] = listRes.data;

        let targets = sessions.filter((s: any) => s.active === false);

        if (opts.tag) {
          targets = targets.filter(
            (s: any) => Array.isArray(s.tags) && s.tags.includes(opts.tag)
          );
        }

        if (targets.length === 0) {
          console.log('No dormant sessions found.');
          return;
        }

        if (opts.dryRun) {
          console.log(`Would reactivate ${targets.length} session(s):`);
          targets.forEach((s: any) => console.log(`  - ${s.name} (${s.id})`));
          return;
        }

        let successCount = 0;
        for (const session of targets) {
          try {
            await axios.patch(`${BASE_URL}/sessions/${session.id}/activate`);
            successCount++;
          } catch {
            console.error(`  Failed to reactivate session: ${session.name} (${session.id})`);
          }
        }

        console.log(`Reactivated ${successCount} of ${targets.length} dormant session(s).`);
      } catch (err: any) {
        console.error('Error reactivating sessions:', err.message);
        process.exit(1);
      }
    });

  return cmd;
}
