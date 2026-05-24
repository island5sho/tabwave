import axios from 'axios';
import { printWakeDormantPinnedResult, createWakeDormantPinnedCommand } from '../commands/wake-dormant-pinned';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantPinnedResult', () => {
  let spy: jest.SpyInstance;
  beforeEach(() => { spy = jest.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => spy.mockRestore());

  it('prints message when nothing to wake', () => {
    printWakeDormantPinnedResult({ woken: [], skipped: [] });
    expect(spy).toHaveBeenCalledWith('No pinned dormant sessions to wake.');
  });

  it('prints woken sessions', () => {
    printWakeDormantPinnedResult({ woken: ['abc', 'def'], skipped: [] });
    expect(spy).toHaveBeenCalledWith('Woke 2 pinned dormant session(s):');
    expect(spy).toHaveBeenCalledWith('  ✓ abc');
    expect(spy).toHaveBeenCalledWith('  ✓ def');
  });

  it('prints skipped count when present', () => {
    printWakeDormantPinnedResult({ woken: ['abc'], skipped: ['xyz'] });
    expect(spy).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant or not pinned).');
  });
});

describe('createWakeDormantPinnedCommand', () => {
  let logSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    logSpy.mockRestore();
    exitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('calls the correct endpoint and prints result', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: ['s1'], skipped: [] } });
    const cmd = createWakeDormantPinnedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/wake-dormant-pinned');
    expect(logSpy).toHaveBeenCalledWith('Woke 1 pinned dormant session(s):');
  });

  it('uses custom host and port', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: [], skipped: [] } });
    const cmd = createWakeDormantPinnedCommand();
    await cmd.parseAsync(['node', 'test', '--host', '192.168.1.5', '--port', '4000']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://192.168.1.5:4000/sessions/wake-dormant-pinned');
  });

  it('exits with code 1 on error', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'connection refused' });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cmd = createWakeDormantPinnedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
  });
});
