import axios from 'axios';
import {
  printWakeDormantLabeledResult,
  createWakeDormantLabeledCommand,
  WakeDormantLabeledResult,
} from '../commands/wake-dormant-labeled';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((() => {}) as any);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('printWakeDormantLabeledResult', () => {
  it('prints message when no sessions woken', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printWakeDormantLabeledResult({ label: 'work', woken: [], skipped: [] });
    expect(spy).toHaveBeenCalledWith(
      'No dormant sessions with label "work" found.'
    );
    spy.mockRestore();
  });

  it('prints woken session ids', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result: WakeDormantLabeledResult = {
      label: 'work',
      woken: ['abc', 'def'],
      skipped: [],
    };
    printWakeDormantLabeledResult(result);
    expect(spy).toHaveBeenCalledWith(
      'Woke 2 dormant session(s) with label "work":'
    );
    expect(spy).toHaveBeenCalledWith('  ✓ abc');
    expect(spy).toHaveBeenCalledWith('  ✓ def');
    spy.mockRestore();
  });

  it('prints skipped count when present', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printWakeDormantLabeledResult({
      label: 'work',
      woken: ['abc'],
      skipped: ['xyz'],
    });
    expect(spy).toHaveBeenCalledWith(
      'Skipped 1 session(s) (not dormant or locked).'
    );
    spy.mockRestore();
  });
});

describe('createWakeDormantLabeledCommand', () => {
  it('calls the correct endpoint and prints result', async () => {
    const result: WakeDormantLabeledResult = {
      label: 'research',
      woken: ['s1'],
      skipped: [],
    };
    mockedAxios.post.mockResolvedValueOnce({ data: result });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const cmd = createWakeDormantLabeledCommand();
    await cmd.parseAsync(['node', 'test', 'research']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/wake-dormant-labeled',
      { label: 'research' }
    );
    expect(spy).toHaveBeenCalledWith(
      'Woke 1 dormant session(s) with label "research":'
    );
    spy.mockRestore();
  });

  it('exits with code 1 on error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'store unavailable' } },
    });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const cmd = createWakeDormantLabeledCommand();
    await cmd.parseAsync(['node', 'test', 'work']);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(spy).toHaveBeenCalledWith('Error: store unavailable');
    spy.mockRestore();
  });
});
