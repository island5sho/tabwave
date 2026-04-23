import axios from 'axios';
import { Command } from 'commander';
import { createWakeCommand } from '../commands/wake';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit');
});

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createWakeCommand());
  await program.parseAsync(['node', 'tabwave', 'wake', ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('wake command', () => {
  it('wakes a frozen session successfully', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        id: 'abc123',
        name: 'Work Session',
        frozen: false,
        status: 'active',
        frozenAt: '2024-01-01T10:00:00.000Z',
      },
    });

    await runCommand(['abc123']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/wake'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Session "Work Session" (abc123) has been woken.'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Previously frozen at:')
    );
  });

  it('uses custom host option', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'My Session', frozen: false, status: 'active' },
    });

    await runCommand(['abc123', '--host', 'http://localhost:4000']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/abc123/wake'
    );
  });

  it('exits with error when session is not found', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 404 },
      message: 'Not Found',
    });

    await expect(runCommand(['missing-id'])).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('Session "missing-id" not found.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('exits with conflict error when session is already active', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { status: 409 },
      message: 'Conflict',
    });

    await expect(runCommand(['active-id'])).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('Session "active-id" is already active.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('exits with generic error on unexpected failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      message: 'Network Error',
    });

    await expect(runCommand(['abc123'])).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('Failed to wake session:', 'Network Error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
