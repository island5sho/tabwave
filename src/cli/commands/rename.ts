import { Command } from 'commander';
import axios from 'axios';
import chalk from 'chalk';

const DEFAULT_HOST = 'http://localhost:3000';

export function createRenameCommand(): Command {
  const rename = new Command('rename');

  rename
    .description('Rename an existing tab session')
    .argument('<old-name>', 'Current session name')
    .argument('<new-name>', 'New session name')
    .option('-H, --host <host>', 'Server host URL', DEFAULT_HOST)
    .action(async (oldName: string, newName: string, options: { host: string }) => {
      const { host } = options;

      if (!oldName || oldName.trim() === '') {
        console.error(chalk.red('Error: Old session name cannot be empty.'));
        process.exit(1);
      }

      if (!newName || newName.trim() === '') {
        console.error(chalk.red('Error: New session name cannot be empty.'));
        process.exit(1);
      }

      if (oldName === newName) {
        console.error(chalk.red('Error: New name must differ from the current name.'));
        process.exit(1);
      }

      try {
        const response = await axios.patch(
          `${host}/sessions/${encodeURIComponent(oldName)}/rename`,
          { newName: newName.trim() }
        );

        if (response.status === 200) {
          console.log(
            chalk.green(`Session renamed: "${oldName}" → "${newName}"`)
          );
        } else {
          console.error(chalk.red(`Unexpected response: ${response.status}`));
          process.exit(1);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          console.error(chalk.red(`Session "${oldName}" not found.`));
        } else if (err.response?.status === 409) {
          console.error(chalk.red(`Session "${newName}" already exists.`));
        } else {
          console.error(chalk.red(`Failed to rename session: ${err.message}`));
        }
        process.exit(1);
      }
    });

  return rename;
}
