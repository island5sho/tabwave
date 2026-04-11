import { Command } from 'commander';
import axios from 'axios';
import { TabSession } from '../../types/session';

const SERVER_URL = process.env.TABWAVE_SERVER || 'http://localhost:3000';

export function createSnapshotCommand(): Command {
  const cmd = new Command('snapshot');

  cmd
    .description('Create a named snapshot of a session at the current point in time')
    .argument('<sessionId>', 'ID of the session to snapshot')
    .option('-l, --label <label>', 'Optional label for the snapshot')
    .action(async (sessionId: string, options: { label?: string }) => {
      try {
        const response = await axios.post(
          `${SERVER_URL}/sessions/${sessionId}/snapshots`,
          { label: options.label }
        );
        const snapshot: TabSession = response.data;
        console.log(`Snapshot created: ${snapshot.id}`);
        if (options.label) {
          console.log(`Label: ${options.label}`);
        }
        console.log(`Tabs captured: ${snapshot.tabs.length}`);
        console.log(`Timestamp: ${new Date(snapshot.updatedAt).toLocaleString()}`);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error('Failed to create snapshot:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
