import axios from 'axios';
import { Command } from 'commander';
import { createUnpauseCommand } from '../commands/unpause';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createUnpauseCommand());
  await program.parseAsync(['node', 'tabwave', 'unpause', ...args]);
}

describe('unpause command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unpauses a session and prints confirmation', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 'abc123', name: 'Work Session', status: 'active' },
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['abc123']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/unpause'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Session "Work Session" (abc123) has been unpaused.'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Status: active');

    consoleSpy.mockRestore();
  });

  it('uses custom host and port', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { id: 'xyz', name: 'Research', status: 'active' },
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['xyz', '--host', '192.168.1.5', '--port', '4000']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://192.168.1.5:4000/sessions/xyz/unpause'
    );

    consoleSpy.mockRestore();
  });

  it('prints error and exits on 404', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 404 } });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['missing-id'])).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('Session not found: missing-id');
    expect(mockExit).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
  });

  it('prints error and exits on 409 (not paused)', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 409 } });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['active-id'])).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('Session is not paused: active-id');

    errorSpy.mockRestore();
  });

  it('prints generic error on unexpected failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'Network Error' });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['some-id'])).rejects.toThrow('process.exit');
    expect(errorSpy).toHaveBeenCalledWith('Failed to unpause session:', 'Network Error');

    errorSpy.mockRestore();
  });
});
