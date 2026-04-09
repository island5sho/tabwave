import axios from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';

const DEFAULT_HOST = 'http://localhost:3000';

export function createDeleteCommand(): Command {
  const cmd = new Command('delete');

  cmd
    .description('Delete a tab session by ID')
    .argument('<sessionId>', 'ID of the session to delete')
    .option('--host <host>', 'Server host URL', DEFAULT_HOST)
    .option('--force', 'Skip confirmation prompt', false)
    .action(async (sessionId: string, options: { host: string; force: boolean }) => {
      const url = `${options.host}/sessions/${sessionId}`;

      if (!options.force) {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const confirmed = await new Promise<boolean>((resolve) => {
          rl.question(
            chalk.yellow(`Are you sure you want to delete session "${sessionId}"? (y/N) `),
            (answer) => {
              rl.close();
              resolve(answer.toLowerCase() === 'y');
            }
          );
        });

        if (!confirmed) {
          console.log(chalk.gray('Deletion cancelled.'));
          return;
        }
      }

      try {
        await axios.delete(url);
        console.log(chalk.green(`✔ Session "${sessionId}" deleted successfully.`));
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(chalk.red(`✘ Session "${sessionId}" not found.`));
        } else {
          console.error(chalk.red(`✘ Failed to delete session: ${err.message}`));
        }
        process.exit(1);
      }
    });

  return cmd;
}
