import axios from 'axios';
import {
  createWakeDormantTaggedAllCommand,
  printWakeDormantTaggedAllResult,
  WakeDormantTaggedAllResult,
} from '../commands/wake-dormant-tagged-all';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('printWakeDormantTaggedAllResult', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints message when no sessions were woken', () => {
    const result: WakeDormantTaggedAllResult = {
      tag: 'work',
      woken: [],
      skipped: [],
    };
    printWakeDormantTaggedAllResult(result);
    expect(consoleSpy).toHaveBeenCalledWith(
      'No dormant sessions with tag "work" found.'
    );
  });

  it('prints woken session ids', () => {
    const result: WakeDormantTaggedAllResult = {
      tag: 'work',
      woken: ['sess-1', 'sess-2'],
      skipped: [],
    };
    printWakeDormantTaggedAllResult(result);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Woke 2 dormant session(s) with tag "work":'
    );
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ sess-1');
    expect(consoleSpy).toHaveBeenCalledWith('  ✓ sess-2');
  });

  it('prints skipped count when present', () => {
    const result: WakeDormantTaggedAllResult = {
      tag: 'work',
      woken: ['sess-1'],
      skipped: ['sess-3'],
    };
    printWakeDormantTaggedAllResult(result);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Skipped 1 session(s) (not dormant or tag mismatch).'
    );
  });
});

describe('createWakeDormantTaggedAllCommand', () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the correct endpoint and prints result', async () => {
    const result: WakeDormantTaggedAllResult = {
      tag: 'research',
      woken: ['s1'],
      skipped: [],
    };
    mockedAxios.post = jest.fn().mockResolvedValue({ data: result });
    const cmd = createWakeDormantTaggedAllCommand();
    await cmd.parseAsync(['node', 'test', 'research']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-tagged-all',
      { tag: 'research' }
    );
  });

  it('exits with code 1 on server error', async () => {
    mockedAxios.post = jest.fn().mockRejectedValue({
      response: { data: { error: 'store unavailable' } },
    });
    const cmd = createWakeDormantTaggedAllCommand();
    await cmd.parseAsync(['node', 'test', 'work']);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: store unavailable');
  });
});
