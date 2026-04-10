import { Command } from 'commander';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { TabSession } from '../../types/session';

const DEFAULT_ARCHIVE_DIR = path.join(process.env.HOME || '.', '.tabwave', 'archives');

export function createArchiveCommand(): Command {
  const cmd = new Command('archive');

  cmd
    .description('Archive a session to a local directory and remove it from the server')
    .argument('<sessionId>', 'ID of the session to archive')
    .option('-d, --dir <directory>', 'archive directory', DEFAULT_ARCHIVE_DIR)
    .option('--keep', 'keep the session on the server after archiving')
    .action(async (sessionId: string, options: { dir: string; keep?: boolean }) => {
      try {
        const res = await axios.get(`http://localhost:3000/sessions/${sessionId}`);
        const session: TabSession = res.data;

        if (!fs.existsSync(options.dir)) {
          fs.mkdirSync(options.dir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${session.name || sessionId}-${timestamp}.json`;
        const filepath = path.join(options.dir, filename);

        fs.writeFileSync(filepath, JSON.stringify(session, null, 2), 'utf-8');
        console.log(`Session archived to: ${filepath}`);

        if (!options.keep) {
          await axios.delete(`http://localhost:3000/sessions/${sessionId}`);
          console.log(`Session "${session.name || sessionId}" removed from server.`);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error('Archive failed:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
