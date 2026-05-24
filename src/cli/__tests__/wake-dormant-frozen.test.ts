import axios from 'axios';
import { printWakeDormantFrozenResult, createWakeDormantFrozenCommand } from '../commands/wake-dormant-frozen';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantFrozenResult', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints message when no sessions woken', () => {
    printWakeDormantFrozenResult({ woken: [], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith('No dormant frozen sessions to wake.');
  });

  it('prints woken session ids', () => {
    printWakeDormantFrozenResult({ woken: ['abc', 'def'], skipped: [] });
    expect(consoleSpy).toHaveBeenCalledWith('Woke 2 dormant frozen session(s):');
    expect(consoleSpy).toHaveBeenCalledWith('  + abc');
    expect(consoleSpy).toHaveBeenCalledWith('  + def');
  });

  it('prints skipped count when some sessions skipped', () => {
    printWakeDormantFrozenResult({ woken: ['abc'], skipped: ['xyz'] });
    expect(consoleSpy).toHaveBeenCalledWith('Skipped 1 session(s) (not dormant or not frozen).');
  });
});

describe('createWakeDormantFrozenCommand', () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('calls the server and prints results', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { woken: ['s1'], skipped: [] },
    });
    const cmd = createWakeDormantFrozenCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-frozen'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Woke 1 dormant frozen session(s):');
  });

  it('exits with code 1 on error', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('connection refused'));
    const cmd = createWakeDormantFrozenCommand();
    const errSpy = jest.spyOn(console, 'error').mockImplementation();
    await cmd.parseAsync(['node', 'test']);
    expect(exitSpy).toHaveBeenCalledWith(1);
    errSpy.mockRestore();
  });
});
