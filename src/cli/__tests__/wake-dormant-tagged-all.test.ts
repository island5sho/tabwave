import axios from 'axios';
import { Command } from 'commander';
import {
  printWakeDormantTaggedAllResult,
  createWakeDormantTaggedAllCommand,
  WakeDormantTaggedAllResult,
} from '../commands/wake-dormant-tagged-all';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantTaggedAllResult', () => {
  let spy: jest.SpyInstance;
  beforeEach(() => {
    spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => spy.mockRestore());

  it('prints no sessions message when wokeCount is 0', () => {
    printWakeDormantTaggedAllResult({ tag: 'work', wokeCount: 0, sessionNames: [] });
    expect(spy).toHaveBeenCalledWith('No dormant sessions found with tag "work".');
  });

  it('lists woken sessions', () => {
    const result: WakeDormantTaggedAllResult = {
      tag: 'work',
      wokeCount: 2,
      sessionNames: ['alpha', 'beta'],
    };
    printWakeDormantTaggedAllResult(result);
    expect(spy).toHaveBeenCalledWith('Woke 2 dormant session(s) tagged "work":');
    expect(spy).toHaveBeenCalledWith('  - alpha');
    expect(spy).toHaveBeenCalledWith('  - beta');
  });
});

describe('createWakeDormantTaggedAllCommand', () => {
  let exitSpy: jest.SpyInstance;
  let errSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('calls correct endpoint and prints result', async () => {
    const result: WakeDormantTaggedAllResult = {
      tag: 'research',
      wokeCount: 1,
      sessionNames: ['session-x'],
    };
    mockedAxios.post.mockResolvedValueOnce({ data: result });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const cmd = createWakeDormantTaggedAllCommand();
    await cmd.parseAsync(['node', 'test', 'research']);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-tagged-all',
      { tag: 'research' }
    );
    expect(logSpy).toHaveBeenCalledWith('Woke 1 dormant session(s) tagged "research":');
    logSpy.mockRestore();
  });

  it('prints error and exits on failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({ message: 'network fail' });
    const cmd = createWakeDormantTaggedAllCommand();
    await cmd.parseAsync(['node', 'test', 'work']);
    expect(errSpy).toHaveBeenCalledWith('Error: network fail');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
