import axios from 'axios';
import { Command } from 'commander';
import { createUnfreezeCommand } from '../commands/unfreeze';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockProcessExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as any);

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createUnfreezeCommand());
  await program.parseAsync(['node', 'tabwave', 'unfreeze', ...args]);
}

describe('unfreeze command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('unfreezes a session successfully', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['abc123']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/abc123/unfreeze'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Session "abc123" has been unfrozen.');
    consoleSpy.mockRestore();
  });

  it('exits with error when session is not found', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 404 } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await runCommand(['missing-id']);

    expect(consoleSpy).toHaveBeenCalledWith('Session "missing-id" not found.');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
  });

  it('exits with error when session is not frozen', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 409 } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await runCommand(['active-session']);

    expect(consoleSpy).toHaveBeenCalledWith('Session "active-session" is not frozen.');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
  });

  it('uses custom host and port options', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['abc123', '--host', '192.168.1.5', '--port', '4000']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://192.168.1.5:4000/sessions/abc123/unfreeze'
    );
    consoleSpy.mockRestore();
  });

  it('handles generic network errors gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await runCommand(['abc123']);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to unfreeze session:',
      'Network Error'
    );
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
  });
});
