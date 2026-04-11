import { Command } from 'commander';
import axios from 'axios';
import { generateShareToken } from '../../utils/share-token';

const DEFAULT_HOST = 'http://localhost:3000';

export function createShareCommand(): Command {
  const cmd = new Command('share');

  cmd
    .description('Generate a shareable link for a session')
    .argument('<sessionId>', 'ID of the session to share')
    .option('-h, --host <host>', 'Server host', DEFAULT_HOST)
    .option('--ttl <seconds>', 'Token time-to-live in seconds', '3600')
    .option('--readonly', 'Generate a read-only share link', false)
    .action(async (sessionId: string, options) => {
      try {
        const ttl = parseInt(options.ttl, 10);
        if (isNaN(ttl) || ttl <= 0) {
          console.error('Error: --ttl must be a positive integer');
          process.exit(1);
        }

        const res = await axios.post(
          `${options.host}/sessions/${sessionId}/share`,
          { ttl, readonly: options.readonly }
        );

        const { token, expiresAt } = res.data;
        const shareUrl = `${options.host}/shared/${token}`;

        console.log(`Share URL: ${shareUrl}`);
        console.log(`Expires at: ${new Date(expiresAt).toLocaleString()}`);
        if (options.readonly) {
          console.log('Access: read-only');
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Error: Session '${sessionId}' not found`);
        } else {
          console.error('Error generating share link:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
