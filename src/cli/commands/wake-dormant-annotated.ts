import axios from 'axios';
import { Command } from 'commander';

export function printWakeDormantAnnotatedResult(woken: string[]): void {
  if (woken.length === 0) {
    console.log('No dormant annotated sessions to wake.');
  } else {
    console.log(`Woke ${woken.length} dormant annotated session(s):`);
    woken.forEach((id) => console.log(`  - ${id}`));
  }
}

export function createWakeDormantAnnotatedCommand(): Command {
  return new Command('wake-dormant-annotated')
    .description('Wake all dormant sessions that have an annotation')
    .option('--port <port>', 'Server port', '3000')
    .action(async (opts) => {
      try {
        const res = await axios.post(
          `http://localhost:${opts.port}/sessions/wake-dormant-annotated`
        );
        printWakeDormantAnnotatedResult(res.data.woken ?? []);
      } catch (err: any) {
        console.error('Error:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
}
