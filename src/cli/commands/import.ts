import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { TabSession } from '../../types/session';
import { validateSession } from '../../utils/session-validator';

const DEFAULT_SERVER = 'http://localhost:3000';

export function createImportCommand(): Command {
  const cmd = new Command('import');

  cmd
    .description('Import a session from a JSON file')
    .argument('<file>', 'Path to the JSON file to import')
    .option('-s, --server <url>', 'Server URL', DEFAULT_SERVER)
    .option('--overwrite', 'Overwrite existing session with the same name', false)
    .action(async (file: string, options: { server: string; overwrite: boolean }) => {
      const filePath = path.resolve(file);

      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }

      let raw: string;
      try {
        raw = fs.readFileSync(filePath, 'utf-8');
      } catch (err) {
        console.error(`Error: Could not read file: ${filePath}`);
        process.exit(1);
      }

      let session: TabSession;
      try {
        session = JSON.parse(raw) as TabSession;
      } catch {
        console.error('Error: File does not contain valid JSON.');
        process.exit(1);
      }

      const validationErrors = validateSession(session);
      if (validationErrors.length > 0) {
        console.error('Error: Invalid session format:');
        validationErrors.forEach((e) => console.error(`  - ${e}`));
        process.exit(1);
      }

      try {
        const url = `${options.server}/sessions/${encodeURIComponent(session.name)}`;

        if (!options.overwrite) {
          const check = await axios.get(url).catch(() => null);
          if (check && check.status === 200) {
            console.error(`Error: Session "${session.name}" already exists. Use --overwrite to replace it.`);
            process.exit(1);
          }
        }

        await axios.put(url, session);
        console.log(`Session "${session.name}" imported successfully (${session.tabs.length} tab(s)).`);
      } catch (err: any) {
        console.error(`Error: Failed to import session — ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
