import axios from 'axios';
import { Command } from 'commander';
import { createUnpauseCommand } from '../commands/unpause';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: any) => { throw new Error(`exit:${code}`); });
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createUnpauseCommand());
  await program.parseAsync(['node', 'test', 'unpause', ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('unpause command', () => {
  it('unpauses a session successfully', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ status: 200, data: {} });

    await runCommand(['session-abc']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/session-abc/unpause'
    );
    expect(mockLog).toHaveBeenCalledWith('Session "session-abc" has been unpaused.');
  });

  it('uses custom port when specified', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ status: 200, data: {} });

    await runCommand(['session-abc', '--port', '4000']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/session-abc/unpause'
    );
  });

  it('exits with error when session not found', async () => {
    mockedAxios.patch.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(runCommand(['missing-session'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Session "missing-session" not found.');
  });

  it('exits with error when session is not paused', async () => {
    mockedAxios.patch.mockRejectedValueOnce({ response: { status: 409 } });

    await expect(runCommand(['active-session'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Session "active-session" is not paused.');
  });

  it('exits with generic error on unexpected failure', async () => {
    mockedAxios.patch.mockRejectedValueOnce({ message: 'Network Error' });

    await expect(runCommand(['session-abc'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Failed to unpause session: Network Error');
  });
});
