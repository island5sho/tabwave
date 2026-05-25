import axios from 'axios';
import { Command } from 'commander';
import { Session } from '../../types/session';

export function printWakeDormantLockedResult(woken: Session[]): void {
  if (woken.length === 0) {
    console.log('No dormant locked sessions to wake.');
    return;
  }
  console.log(`Woke ${woken.length} dormant locked session(s):`);
  for (const s of woken) {
    console.log(`  - ${s.name} (${s.id})`);
  }
}

export function createWakeDormantLockedCommand(): Command {
  const cmd = new Command('wake-dormant-locked');
  cmd
    .description('Wake all dormant locked sessions')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        const res = await axios.post(`${base}/sessions/wake-dormant-locked`);
        printWakeDormantLockedResult(res.data.woken ?? []);
      } catch (err: any) {
        console.error('Failed to wake dormant locked sessions:', err.message);
        process.exit(1);
      }
    });
  return cmd;
}
