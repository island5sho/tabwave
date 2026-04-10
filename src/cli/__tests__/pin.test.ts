import axios from 'axios';
import { createPinCommand } from '../commands/pin';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const runCommand = async (args: string[]) => {
  const cmd = createPinCommand();
  // Prevent process.exit from killing the test runner
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  try {
    await cmd.parseAsync(['node', 'pin', ...args]);
  } catch (_) {}

  return { exitSpy, logSpy, errorSpy };
};

afterEach(() => jest.restoreAllMocks());

describe('pin command', () => {
  it('pins a session successfully', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs', pinned: true },
    });

    const { logSpy } = await runCommand(['abc123']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123/pin'),
      { pinned: true }
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('pinned'));
  });

  it('unpins a session when --unpin flag is provided', async () => {
    mockedAxios.patch.mockResolvedValueOnce({
      status: 200,
      data: { id: 'abc123', name: 'Work Tabs', pinned: false },
    });

    const { logSpy } = await runCommand(['abc123', '--unpin']);

    expect(mockedAxios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123/pin'),
      { pinned: false }
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('unpinned'));
  });

  it('prints error and exits when session is not found', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 404 },
      message: 'Not Found',
    });

    const { errorSpy, exitSpy } = await runCommand(['nonexistent']);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('prints generic error and exits on server failure', async () => {
    mockedAxios.patch.mockRejectedValueOnce({
      response: { status: 500 },
      message: 'Internal Server Error',
    });

    const { errorSpy, exitSpy } = await runCommand(['abc123']);

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to update pin status'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
