import axios from 'axios';
import { createCopyCommand } from '../commands/copy';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const runCommand = async (...args: string[]) => {
  const cmd = createCopyCommand();
  await cmd.parseAsync(['node', 'copy', ...args]);
};

const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((_code?: number) => undefined as never);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('copy command', () => {
  it('copies all tabs from source to target', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { copied: 3 } });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand('work', 'backup');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/copy',
      { source: 'work', target: 'backup', indices: undefined }
    );
    expect(spy).toHaveBeenCalledWith('Copied 3 tab(s) from "work" to "backup".');
    spy.mockRestore();
  });

  it('copies specific tabs by indices', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { copied: 2 } });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand('work', 'backup', '--indices', '0,2');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/copy',
      { source: 'work', target: 'backup', indices: [0, 2] }
    );
    expect(spy).toHaveBeenCalledWith('Copied 2 tab(s) from "work" to "backup".');
    spy.mockRestore();
  });

  it('uses custom port', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { copied: 1 } });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand('src', 'dst', '--port', '4000');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:4000/sessions/copy',
      expect.any(Object)
    );
    spy.mockRestore();
  });

  it('prints error and exits on server error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Source session not found' } },
    });

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await runCommand('ghost', 'backup');

    expect(errSpy).toHaveBeenCalledWith('Error copying tabs: Source session not found');
    expect(mockExit).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
  });

  it('falls back to err.message when no response body', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await runCommand('a', 'b');

    expect(errSpy).toHaveBeenCalledWith('Error copying tabs: Network Error');
    errSpy.mockRestore();
  });
});
