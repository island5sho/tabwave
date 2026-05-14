import axios from 'axios';
import { Command } from 'commander';

export function createWakeAllCommand(): Command {
  const cmd = new Command('wake-all');

  cmd
    .description('Wake all frozen sessions at once')
    .option('--port <port>', 'Server port', '3000')
    .option('--dry-run', 'Preview which sessions would be woken without applying changes')
    .action(async (opts) => {
      const base = `http://localhost:${opts.port}`;

      let sessions: any[];
      try {
        const res = await axios.get(`${base}/sessions`);
        sessions = res.data;
      } catch {
        console.error('Could not reach tabwave server.');
        process.exit(1);
      }

      const frozen = sessions.filter((s: any) => s.frozen === true);

      if (frozen.length === 0) {
        console.log('No frozen sessions found.');
        return;
      }

      if (opts.dryRun) {
        console.log(`Would wake ${frozen.length} session(s):`);
        frozen.forEach((s: any) => console.log(`  - ${s.name} (${s.id})`));
        return;
      }

      let woken = 0;
      let failed = 0;

      for (const session of frozen) {
        try {
          await axios.post(`${base}/sessions/${session.id}/wake`);
          console.log(`Woke: ${session.name} (${session.id})`);
          woken++;
        } catch {
          console.error(`Failed to wake: ${session.name} (${session.id})`);
          failed++;
        }
      }

      console.log(`\nDone. Woken: ${woken}, Failed: ${failed}`);
    });

  return cmd;
}
