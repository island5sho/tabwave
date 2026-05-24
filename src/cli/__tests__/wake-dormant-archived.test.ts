import axios from 'axios';
import { printWakeDormantArchivedResult, createWakeDormantArchivedCommand } from '../commands/wake-dormant-archived';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantArchivedResult', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints message when no sessions woken', () => {
    printWakeDormantArchivedResult({ woken: [], skipped: [] });
    expect(log).toHaveBeenCalledWith('No dormant archived sessions to wake.');
  });

  it('prints woken session ids', () => {
    printWakeDormantArchivedResult({ woken: ['abc', 'def'], skipped: [] });
    expect(log).toHaveBeenCalledWith('Woke 2 dormant archived session(s):');
    expect(log).toHaveBeenCalledWith('  ✓ abc');
    expect(log).toHaveBeenCalledWith('  ✓ def');
  });

  it('prints skipped count when some sessions skipped', () => {
    printWakeDormantArchivedResult({ woken: ['abc'], skipped: ['xyz'] });
    expect(log).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant or not archived).');
  });
});

describe('createWakeDormantArchivedCommand', () => {
  let log: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the server and prints result', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { woken: ['s1'], skipped: [] } });
    const cmd = createWakeDormantArchivedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/wake-dormant-archived');
    expect(log).toHaveBeenCalledWith('Woke 1 dormant archived session(s):');
  });

  it('exits on error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('conn refused'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cmd = createWakeDormantArchivedCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith('Failed to wake dormant archived sessions:', 'conn refused');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
