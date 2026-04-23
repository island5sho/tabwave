import axios from 'axios';
import { Command } from 'commander';

export function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return 'expired';
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (diffHrs > 0) return `expires in ${diffHrs}h ${diffMins}m`;
  return `expires in ${diffMins}m`;
}

export function createExpireCommand(): Command {
  const cmd = new Command('expire');

  cmd
    .description('Set an expiry time on a session after which it will be auto-removed')
    .argument('<id>', 'Session ID')
    .option('-t, --ttl <minutes>', 'Time-to-live in minutes', '60')
    .option('--clear', 'Clear the expiry from the session')
    .option('-H, --host <host>', 'Server host', 'http://localhost:3000')
    .action(async (id: string, opts) => {
      try {
        if (opts.clear) {
          const res = await axios.patch(`${opts.host}/sessions/${id}/expire`, { expiresAt: null });
          console.log(`Expiry cleared for session "${res.data.name}".`);
        } else {
          const ttl = parseInt(opts.ttl, 10);
          if (isNaN(ttl) || ttl <= 0) {
            console.error('TTL must be a positive integer (minutes).');
            process.exit(1);
          }
          const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();
          const res = await axios.patch(`${opts.host}/sessions/${id}/expire`, { expiresAt });
          console.log(`Session "${res.data.name}" will ${formatExpiry(res.data.expiresAt)}.`);
        }
      } catch (err: any) {
        const msg = err.response?.data?.error ?? err.message;
        console.error(`Error: ${msg}`);
        process.exit(1);
      }
    });

  return cmd;
}
