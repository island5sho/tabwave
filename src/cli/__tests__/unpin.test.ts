import axios from 'axios';
import { Command } from 'commander';
import { createUnpinCommand } from '../commands/unpin';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
  throw new Error(`process.exit(${code})`);
});

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createUnpinCommand());
  await program.parseAsync(['node', 'tabwave', ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('unpin command', () => {
  it('unpins a pinned session successfully', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs', pinned: false },
    });

    await runCommand(['unpin', 'abc123']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/unpin'
    );
    expect(mockConsoleLog).toHaveBeenCalledWith('Session "Work Tabs" unpinned.');
  });

  it('exits with error when session is not found', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 404 },
      message: 'Not Found',
    });

    await expect(runCommand(['unpin', 'missing-id'])).rejects.toThrow('process.exit(1)');
    expect(mockConsoleError).toHaveBeenCalledWith('Session not found: missing-id');
  });

  it('exits with error when session is not pinned', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 400 },
      message: 'Bad Request',
    });

    await expect(runCommand(['unpin', 'abc123'])).rejects.toThrow('process.exit(1)');
    expect(mockConsoleError).toHaveBeenCalledWith('Session is not pinned: abc123');
  });

  it('exits with generic error on unexpected failure', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      message: 'Network Error',
    });

    await expect(runCommand(['unpin', 'abc123'])).rejects.toThrow('process.exit(1)');
    expect(mockConsoleError).toHaveBeenCalledWith(
      'Failed to unpin session:',
      'Network Error'
    );
  });

  it('uses custom server URL when provided', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Dev Tabs', pinned: false },
    });

    await runCommand(['unpin', 'abc123', '--server', 'http://localhost:4000']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/abc123/unpin'
    );
  });
});
