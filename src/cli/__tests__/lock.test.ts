import axios from 'axios';
import { Command } from 'commander';
import { createLockCommand } from '../commands/lock';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockProcessExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((_code?: number) => undefined as never);

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createLockCommand());
  await program.parseAsync(['node', 'tabwave', ...args]);
}

describe('lock command', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('locks a session by ID', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs', locked: true },
    });

    await runCommand(['lock', 'abc123']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/lock',
      { locked: true }
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Session "Work Tabs" is now locked.');
  });

  it('unlocks a session with --unlock flag', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs', locked: false },
    });

    await runCommand(['lock', 'abc123', '--unlock']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/lock',
      { locked: false }
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Session "Work Tabs" is now unlocked.');
  });

  it('prints error and exits when session not found', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 404 },
      message: 'Not Found',
    });

    await runCommand(['lock', 'missing-id']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Session "missing-id" not found.');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('prints conflict error when session already locked', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 409 },
      message: 'Conflict',
    });

    await runCommand(['lock', 'abc123']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Session "abc123" is already locked.');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('handles generic network error', async () => {
    mockedAxios.patch.mockRejectedValueOnce(new Error('Network Error'));

    await runCommand(['lock', 'abc123']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to lock session: Network Error');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
