import axios from 'axios';
import { Command } from 'commander';

// "bounce" = deactivate then immediately reactivate a session
// useful for forcing a fresh sync / resetting transient state

export function createBounceCommand(): Command {
  const cmd = new Command('bounce');

  cmd
    .description('Deactivate and immediately reactivate a session (soft reset)')
    .argument('<id>', 'Session ID to bounce')
    .option('-p, --port <port>', 'Server port', '3000')
    .option('--delay <ms>', 'Milliseconds to wait between deactivate and reactivate', '200')
    .action(async (id: string, opts: { port: string; delay: string }) => {
      const base = `http://localhost:${opts.port}`;
      const delayMs = parseInt(opts.delay, 10);

      try {
        // Step 1: deactivate
        await axios.post(`${base}/sessions/${id}/deactivate`);
        console.log(`Session "${id}" deactivated.`);

        // Step 2: optional delay
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }

        // Step 3: reactivate
        await axios.post(`${base}/sessions/${id}/activate`);
        console.log(`Session "${id}" reactivated. Bounce complete.`);
      } catch (err: any) {
        const msg = err?.response?.data?.error ?? err.message;
        console.error(`Bounce failed: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
