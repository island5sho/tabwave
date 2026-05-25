import axios from 'axios';
import { createWakeDormantBookmarkedCommand, printWakeDormantBookmarkedResult } from '../commands/wake-dormant-bookmarked';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantBookmarkedResult', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints message when no sessions woken', () => {
    printWakeDormantBookmarkedResult([]);
    expect(log).toHaveBeenCalledWith('No dormant bookmarked sessions to wake.');
  });

  it('prints woken session ids', () => {
    printWakeDormantBookmarkedResult(['abc', 'def']);
    expect(log).toHaveBeenCalledWith('Woke 2 dormant bookmarked session(s):');
    expect(log).toHaveBeenCalledWith('  - abc');
    expect(log).toHaveBeenCalledWith('  - def');
  });
});

describe('createWakeDormantBookmarkedCommand', () => {
  let log: jest.SpyInstance;
  let exit: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(console, 'log').mockImplementation(() => {});
    exit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the correct endpoint and prints result', async () => {
    mockedAxios.post.mockResolvedValue({ data: { woken: ['s1', 's2'] } });
    const cmd = createWakeDormantBookmarkedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-bookmarked'
    );
    expect(log).toHaveBeenCalledWith('Woke 2 dormant bookmarked session(s):');
  });

  it('exits on error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('connection refused'));
    const errLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cmd = createWakeDormantBookmarkedCommand();
    await cmd.parseAsync(['node', 'test']);
    expect(exit).toHaveBeenCalledWith(1);
    errLog.mockRestore();
  });
});
