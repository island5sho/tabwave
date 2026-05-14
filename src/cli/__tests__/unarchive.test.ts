import axios from 'axios';
import { Command } from 'commander';
import { createUnarchiveCommand } from '../commands/unarchive';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const runCommand = async (...args: string[]): Promise<void> => {
  const program = new Command();
  program.addCommand(createUnarchiveCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'tabwave', 'unarchive', ...args]);
};

const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((_code?: number) => {
    throw new Error('process.exit');
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('unarchive command', () => {
  it('unarchives a session and prints confirmation', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs' },
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await runCommand('abc123');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/unarchive'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Session "Work Tabs" has been unarchived.'
    );
    consoleSpy.mockRestore();
  });

  it('exits with error when session is not found', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 404 },
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await expect(runCommand('missing-id')).rejects.toThrow('process.exit');
    expect(consoleSpy).toHaveBeenCalledWith('Session "missing-id" not found.');
    expect(mockExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
  });

  it('exits with error when session is not archived', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 409 },
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await expect(runCommand('active-id')).rejects.toThrow('process.exit');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Session "active-id" is not archived.'
    );
    consoleSpy.mockRestore();
  });

  it('exits with generic error on unexpected failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Internal error' } },
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    await expect(runCommand('abc123')).rejects.toThrow('process.exit');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to unarchive session:',
      'Internal error'
    );
    consoleSpy.mockRestore();
  });
});
