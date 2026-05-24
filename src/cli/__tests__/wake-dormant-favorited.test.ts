import axios from 'axios';
import { printWakeDormantFavoritedResult, createWakeDormantFavoritedCommand } from '../commands/wake-dormant-favorited';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantFavoritedResult', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('prints message when no sessions woken', () => {
    printWakeDormantFavoritedResult({ woken: [], skipped: [] });
    expect(log).toHaveBeenCalledWith('No dormant favorited sessions to wake.');
  });

  it('prints woken session ids', () => {
    printWakeDormantFavoritedResult({ woken: ['abc', 'def'], skipped: [] });
    expect(log).toHaveBeenCalledWith('Woke 2 dormant favorited session(s):');
    expect(log).toHaveBeenCalledWith('  + abc');
    expect(log).toHaveBeenCalledWith('  + def');
  });

  it('prints skipped count when some skipped', () => {
    printWakeDormantFavoritedResult({ woken: ['abc'], skipped: ['xyz'] });
    expect(log).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant or not favorited).');
  });
});

describe('createWakeDormantFavoritedCommand', () => {
  let log: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => jest.restoreAllMocks());

  it('calls server and prints result', async () => {
    mockedAxios.post.mockResolvedValue({ data: { woken: ['s1'], skipped: [] } });
    const cmd = createWakeDormantFavoritedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/wake-dormant-favorited');
    expect(log).toHaveBeenCalledWith('Woke 1 dormant favorited session(s):');
  });

  it('exits on error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('conn refused'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cmd = createWakeDormantFavoritedCommand();
    await expect(cmd.parseAsync(['node', 'test'])).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
  });
});
