import { Command } from 'commander';
import axios from 'axios';
import { resolveConflict } from '../../sync/conflict-resolver';
import { Session } from '../../types/session';

const DEFAULT_HOST = 'http://localhost:3000';

export function createMergeCommand(): Command {
  const cmd = new Command('merge');

  cmd
    .description('Merge a remote session into a local session by name')
    .argument('<local-name>', 'Name of the local session')
    .argument('<remote-name>', 'Name of the remote session to merge from')
    .option('--host <host>', 'Server host URL', DEFAULT_HOST)
    .option('--strategy <strategy>', 'Merge strategy: newest | local | remote', 'newest')
    .action(async (localName: string, remoteName: string, options) => {
      const { host, strategy } = options;

      let localSession: Session;
      let remoteSession: Session;

      try {
        const localRes = await axios.get(`${host}/sessions/${encodeURIComponent(localName)}`);
        localSession = localRes.data;
      } catch {
        console.error(`Error: Local session "${localName}" not found.`);
        process.exit(1);
      }

      try {
        const remoteRes = await axios.get(`${host}/sessions/${encodeURIComponent(remoteName)}`);
        remoteSession = remoteRes.data;
      } catch {
        console.error(`Error: Remote session "${remoteName}" not found.`);
        process.exit(1);
      }

      const validStrategies = ['newest', 'local', 'remote'];
      if (!validStrategies.includes(strategy)) {
        console.error(`Error: Invalid strategy "${strategy}". Choose from: ${validStrategies.join(', ')}`);
        process.exit(1);
      }

      const merged = resolveConflict(localSession, remoteSession, strategy as 'newest' | 'local' | 'remote');
      merged.name = localName;
      merged.updatedAt = new Date().toISOString();

      try {
        await axios.put(`${host}/sessions/${encodeURIComponent(localName)}`, merged);
        console.log(`Merged "${remoteName}" into "${localName}" using strategy: ${strategy}`);
        console.log(`Total tabs after merge: ${merged.tabs.length}`);
      } catch (err: any) {
        console.error(`Error saving merged session: ${err.message}`);
        process.exit(1);
      }
    });

  return cmd;
}
