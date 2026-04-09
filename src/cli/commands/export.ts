import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Session } from '../../types/session';

const DEFAULT_SERVER = 'http://localhost:3000';

export function createExportCommand(): Command {
  const cmd = new Command('export');

  cmd
    .description('Export a session to a JSON file')
    .argument('<sessionId>', 'ID of the session to export')
    .option('-o, --output <file>', 'Output file path (default: <sessionId>.json)')
    .option('-s, --server <url>', 'Server URL', DEFAULT_SERVER)
    .option('--pretty', 'Pretty-print the JSON output', false)
    .action(async (sessionId: string, options: { output?: string; server: string; pretty: boolean }) => {
      try {
        const serverUrl = options.server;
        const response = await axios.get<Session>(`${serverUrl}/sessions/${sessionId}`);
        const session = response.data;

        const outputFile = options.output ?? `${sessionId}.json`;
        const outputPath = path.resolve(process.cwd(), outputFile);

        const jsonContent = options.pretty
          ? JSON.stringify(session, null, 2)
          : JSON.stringify(session);

        fs.writeFileSync(outputPath, jsonContent, 'utf-8');

        console.log(`Session "${session.name}" exported to ${outputPath}`);
        console.log(`  Tabs: ${session.tabs.length}`);
        console.log(`  Last updated: ${new Date(session.updatedAt).toLocaleString()}`);
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.error(`Error: Session "${sessionId}" not found.`);
        } else {
          console.error('Error exporting session:', error.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
