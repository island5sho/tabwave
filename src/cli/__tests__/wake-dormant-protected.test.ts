import axios from 'axios';
import { printWakeDormantProtectedResult, createWakeDormantProtectedCommand } from '../commands/wake-dormant-protected';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantProtectedResult', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints message when no sessions woken', () => {
    printWakeDormantProtectedResult({ woken: [], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith('No dormant protected sessions to wake.');
  });

  it('lists woken sessions', () => {
    printWakeDormantProtectedResult({ woken: ['abc', 'def'], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 dormant protected session(s):');
    expect(consoleSpy).toHaveBeenCalledWith('  - abc');
    expect(consoleSpy).toHaveBeenCalledWith('  - def');
  });

  it('reports skipped sessions', () => {
    printWakeDormantProtectedResult({ woken: ['abc'], skipped: ['xyz'] });
    expect(consoleSpy).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant or not protected).');
  });
});

describe('createWakeDormantProtectedCommand', () => {
  let exitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the server and prints result', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: ['s1'], skipped: [] } });
    const cmd = createWakeDormantProtectedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/wake-dormant-protected');
    expect(consoleSpy).toHaveBeenCalledWith('Woke 1 dormant protected session(s):');
  });

  it('exits on server error', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'Network error', response: undefined });
    const cmd = createWakeDormantProtectedCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
