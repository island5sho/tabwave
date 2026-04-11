import { Command } from 'commander';
import axios from 'axios';
import { diffSessions, hasDiff } from '../../sync/session-diff';
import { TabSession } from '../../types/session';

function printDiff(localSession: TabSession, remoteSession: TabSession): void {
  const diff = diffSessions(localSession, remoteSession);

  if (!hasDiff(diff)) {
    console.log('✓ Sessions are identical.');
    return;
  }

  if (diff.added.length > 0) {
    console.log(`\n+ Added tabs (${diff.added.length}):`);
    for (const tab of diff.added) {
      console.log(`  + [${tab.title}] ${tab.url}`);
    }
  }

  if (diff.removed.length > 0) {
    console.log(`\n- Removed tabs (${diff.removed.length}):`);
    for (const tab of diff.removed) {
      console.log(`  - [${tab.title}] ${tab.url}`);
    }
  }

  if (diff.modified.length > 0) {
    console.log(`\n~ Modified tabs (${diff.modified.length}):`);
    for (const tab of diff.modified) {
      console.log(`  ~ [${tab.title}] ${tab.url}`);
    }
  }
}

export function createDiffCommand(): Command {
  const cmd = new Command('diff');

  cmd
    .description('Show differences between local and remote session')
    .argument('<sessionId>', 'Session ID to diff')
    .option('-H, --host <host>', 'Server host', 'http://localhost:3000')
    .action(async (sessionId: string, options: { host: string }) => {
      try {
        const localRes = await axios.get(`${options.host}/sessions/${sessionId}`);
        const remoteRes = await axios.get(`${options.host}/sessions/${sessionId}/remote`);

        const localSession: TabSession = localRes.data;
        const remoteSession: TabSession = remoteRes.data;

        console.log(`Diffing session: ${localSession.name} (${sessionId})`);
        console.log(`Local  updated: ${new Date(localSession.updatedAt).toLocaleString()}`);
        console.log(`Remote updated: ${new Date(remoteSession.updatedAt).toLocaleString()}`);

        printDiff(localSession, remoteSession);
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionId}" not found.`);
        } else {
          console.error('Error fetching sessions:', err.message);
        }
        process.exit(1);
      }
    });

  return cmd;
}
