import { Command } from 'commander';
import fetch from 'node-fetch';
import { Session } from '../../types/session';

export function createRestoreCommand(): Command {
  const cmd = new Command('restore');

  cmd
    .description('Restore a session from a snapshot')
    .argument('<sessionId>', 'ID of the session to restore a snapshot for')
    .argument('<snapshotIndex>', 'Index of the snapshot to restore (0 = most recent)')
    .option('--host <host>', 'Server host', 'localhost')
    .option('--port <port>', 'Server port', '3000')
    .action(async (sessionId: string, snapshotIndex: string, options) => {
      const { host, port } = options;
      const index = parseInt(snapshotIndex, 10);

      if (isNaN(index) || index < 0) {
        console.error('Error: snapshotIndex must be a non-negative integer');
        process.exit(1);
      }

      let res: import('node-fetch').Response;
      try {
        res = await fetch(
          `http://${host}:${port}/sessions/${sessionId}/restore`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ snapshotIndex: index }),
          }
        );
      } catch (err) {
        console.error('Error: could not connect to server');
        process.exit(1);
        return;
      }

      if (res.status === 404) {
        const body = (await res.json()) as { error?: string };
        console.error(`Error: ${body.error ?? 'session or snapshot not found'}`);
        process.exit(1);
        return;
      }

      if (!res.ok) {
        console.error(`Error: server responded with status ${res.status}`);
        process.exit(1);
        return;
      }

      const session = (await res.json()) as Session;
      console.log(
        `Restored session "${session.name}" (${session.id}) from snapshot #${index} — ${session.tabs.length} tab(s)`
      );
    });

  return cmd;
}
