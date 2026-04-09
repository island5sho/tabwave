import { Command } from 'commander';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TabSession } from '../../types/session';

const execAsync = promisify(exec);

const PLATFORM_COMMANDS: Record<string, string> = {
  darwin: 'open',
  linux: 'xdg-open',
  win32: 'start',
};

export async function openSessionTabs(
  sessionName: string,
  serverUrl: string
): Promise<void> {
  const response = await axios.get<TabSession>(
    `${serverUrl}/sessions/${encodeURIComponent(sessionName)}`
  );

  const session = response.data;

  if (!session || !session.tabs || session.tabs.length === 0) {
    console.log(`No tabs found in session "${sessionName}".`);
    return;
  }

  const platform = process.platform;
  const openCmd = PLATFORM_COMMANDS[platform];

  if (!openCmd) {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
  }

  console.log(
    `Opening ${session.tabs.length} tab(s) from session "${sessionName}"...`
  );

  for (const tab of session.tabs) {
    try {
      await execAsync(`${openCmd} "${tab.url}"`);
      console.log(`  Opened: ${tab.url}`);
    } catch (err) {
      console.warn(`  Failed to open: ${tab.url}`);
    }
  }
}

export function createOpenCommand(serverUrl: string): Command {
  return new Command('open')
    .description('Open all tabs from a saved session in the default browser')
    .argument('<session-name>', 'Name of the session to open')
    .option('--dry-run', 'List tabs without opening them', false)
    .action(async (sessionName: string, options: { dryRun: boolean }) => {
      try {
        if (options.dryRun) {
          const response = await axios.get<TabSession>(
            `${serverUrl}/sessions/${encodeURIComponent(sessionName)}`
          );
          const session = response.data;
          console.log(`Tabs in session "${sessionName}":`);
          session.tabs.forEach((tab, i) => {
            console.log(`  ${i + 1}. ${tab.title || tab.url} — ${tab.url}`);
          });
        } else {
          await openSessionTabs(sessionName, serverUrl);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(`Session "${sessionName}" not found.`);
        } else {
          console.error(`Error opening session: ${err.message}`);
        }
        process.exit(1);
      }
    });
}
