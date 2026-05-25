import axios from 'axios';
import { createWakeDormantNotedCommand, printWakeDormantNotedResult } from '../commands/wake-dormant-noted';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const BASE_URL = 'http://localhost:3000';

function makeSession(overrides = {}) {
  return {
    id: 'session-1',
    name: 'Test Session',
    tabs: [],
    dormant: false,
    note: 'Some note',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('printWakeDormantNotedResult', () => {
  it('prints the woken session info', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const session = makeSession();
    printWakeDormantNotedResult(session as any);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Test Session'));
    spy.mockRestore();
  });
});

describe('createWakeDormantNotedCommand', () => {
  afterEach(() => jest.clearAllMocks());

  it('calls the correct endpoint and prints result', async () => {
    const session = makeSession();
    mockedAxios.post.mockResolvedValueOnce({ data: { session } });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const cmd = createWakeDormantNotedCommand(BASE_URL);
    await cmd.parseAsync(['node', 'test', 'session-1']);
    expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}/sessions/session-1/wake-dormant-noted`);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('session-1'));
    spy.mockRestore();
  });

  it('prints error and exits on failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { data: { error: 'Session not found' } } });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const cmd = createWakeDormantNotedCommand(BASE_URL);
    await expect(cmd.parseAsync(['node', 'test', 'bad-id'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Session not found'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
