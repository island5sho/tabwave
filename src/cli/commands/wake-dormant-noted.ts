import { Command } from 'commander';
import axios from 'axios';
import { Session } from '../../types/session';

export function printWakeDormantNotedResult(session: Session): void {
  console.log(`Woke dormant noted session: ${session.name} (${session.id})`);
}

export function createWakeDormantNotedCommand(baseUrl: string): Command {
  const cmd = new Command('wake-dormant-noted');
  cmd
    .description('Wake a dormant session that has a note')
    .argument('<id>', 'Session ID')
    .action(async (id: string) => {
      try {
        const res = await axios.post(`${baseUrl}/sessions/${id}/wake-dormant-noted`);
        printWakeDormantNotedResult(res.data.session);
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });
  return cmd;
}
