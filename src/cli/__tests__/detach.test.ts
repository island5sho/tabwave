import axios from 'axios';
import { Command } from 'commander';
import { createDetachCommand } from '../commands/detach';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: any) => { throw new Error(`exit:${code}`); });
const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createDetachCommand());
  await program.parseAsync(['node', 'test', 'detach', ...args]);
}

describe('detach command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('detaches a tab and prints the new session id', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { newSessionId: 'new-123', tab: { title: 'GitHub', url: 'https://github.com' } },
    });

    await runCommand(['session-abc', '0']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/session-abc/detach',
      { tabIndex: 0, name: undefined }
    );
    expect(mockLog).toHaveBeenCalledWith('Detached tab "GitHub" into new session: new-123');
  });

  it('passes custom name option', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { newSessionId: 'new-456', tab: { title: 'MDN', url: 'https://mdn.io' } },
    });

    await runCommand(['session-abc', '1', '--name', 'My Detached']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      { tabIndex: 1, name: 'My Detached' }
    );
  });

  it('exits with error on invalid tab index', async () => {
    await expect(runCommand(['session-abc', '-1'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Tab index must be a non-negative integer.');
  });

  it('exits with error when server returns 404', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Session not found' } },
      message: 'Request failed',
    });

    await expect(runCommand(['missing-id', '0'])).rejects.toThrow('exit:1');
    expect(mockError).toHaveBeenCalledWith('Failed to detach tab: Session not found');
  });

  it('uses custom host and port', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { newSessionId: 'new-789', tab: { title: 'Test', url: 'https://test.com' } },
    });

    await runCommand(['session-abc', '0', '--host', '192.168.1.5', '--port', '8080']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://192.168.1.5:8080/sessions/session-abc/detach',
      expect.any(Object)
    );
  });
});
