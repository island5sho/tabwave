import axios from 'axios';
import { Command } from 'commander';
import { createUnprotectCommand } from '../commands/unprotect';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
  throw new Error(`process.exit(${code})`);
});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createUnprotectCommand());
  await program.parseAsync(['node', 'tabwave', 'unprotect', ...args]);
}

describe('unprotect command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unprotects a session successfully', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs', protected: false },
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['abc123']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123/unprotect')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Work Tabs')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('unprotected')
    );

    consoleSpy.mockRestore();
  });

  it('exits with error when session is not found', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 404 },
      message: 'Not Found',
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['missing-id'])).rejects.toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));

    errorSpy.mockRestore();
  });

  it('exits with error when session is not protected', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 400 },
      message: 'Bad Request',
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['abc123'])).rejects.toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('not currently protected')
    );

    errorSpy.mockRestore();
  });

  it('exits with error on unexpected failure', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      message: 'Network Error',
    });

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['abc123'])).rejects.toThrow('process.exit(1)');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to unprotect session'),
      'Network Error'
    );

    errorSpy.mockRestore();
  });
});
