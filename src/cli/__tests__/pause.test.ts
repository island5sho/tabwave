import axios from 'axios';
import { Command } from 'commander';
import { createPauseCommand } from '../commands/pause';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: any) => { throw new Error(`exit:${code}`); });
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createPauseCommand());
  program.exitOverride();
  await program.parseAsync(['node', 'tabwave', ...args]);
}

beforeEach(() => jest.clearAllMocks());

describe('pause command', () => {
  it('pauses a session successfully', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ status: 200, data: { name: 'Work' } });
    await runCommand(['pause', 'abc123']);
    expect(mockLog).toHaveBeenCalledWith('Session "Work" has been paused.');
  });

  it('shows error when session not found', async () => {
    mockedAxios.patch.mockRejectedValueOnce({ response: { status: 404 } });
    await expect(runCommand(['pause', 'missing'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Session "missing" not found.');
  });

  it('shows error when session is already paused', async () => {
    mockedAxios.patch.mockRejectedValueOnce({ response: { status: 409 } });
    await expect(runCommand(['pause', 'abc123'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Session "abc123" is already paused.');
  });

  it('shows generic error on unexpected failure', async () => {
    mockedAxios.patch.mockRejectedValueOnce({ message: 'Network Error' });
    await expect(runCommand(['pause', 'abc123'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Failed to pause session:', 'Network Error');
  });

  it('uses custom port when provided', async () => {
    mockedAxios.patch.mockResolvedValueOnce({ status: 200, data: { name: 'Dev' } });
    await runCommand(['pause', 'abc123', '--port', '4000']);
    expect(mockedAxios.patch).toHaveBeenCalledWith('http://localhost:4000/sessions/abc123/pause');
  });
});
