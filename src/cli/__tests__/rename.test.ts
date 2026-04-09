import axios from 'axios';
import { Command } from 'commander';
import { createRenameCommand } from '../commands/rename';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('rename command', () => {
  let program: Command;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    program = new Command();
    program.addCommand(createRenameCommand());
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renames a session successfully', async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({ status: 200 });

    await program.parseAsync(['node', 'tabwave', 'rename', 'work', 'work-v2']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/work/rename',
      { newName: 'work-v2' }
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('work')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('work-v2')
    );
  });

  it('exits with error when session not found (404)', async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({ response: { status: 404 } });

    await program.parseAsync(['node', 'tabwave', 'rename', 'ghost', 'new-ghost']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('not found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when new name conflicts (409)', async () => {
    mockedAxios.patch = jest.fn().mockRejectedValue({ response: { status: 409 } });

    await program.parseAsync(['node', 'tabwave', 'rename', 'work', 'existing']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error when old and new names are the same', async () => {
    await program.parseAsync(['node', 'tabwave', 'rename', 'work', 'work']);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('must differ')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('uses custom host when --host flag is provided', async () => {
    mockedAxios.patch = jest.fn().mockResolvedValue({ status: 200 });

    await program.parseAsync([
      'node', 'tabwave', 'rename', 'alpha', 'beta',
      '--host', 'http://192.168.1.10:4000'
    ]);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://192.168.1.10:4000/sessions/alpha/rename',
      { newName: 'beta' }
    );
  });
});
