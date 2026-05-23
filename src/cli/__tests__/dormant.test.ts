import axios from 'axios';
import { Command } from 'commander';
import { createDormantCommand, printDormantSession } from '../commands/dormant';
import { TabSession } from '../../types/session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'abc123',
    name: 'Test Session',
    tabs: [{ url: 'https://example.com', title: 'Example' }],
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    ...overrides,
  };
}

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createDormantCommand());
  await program.parseAsync(['node', 'test', ...args]);
}

describe('dormant command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists dormant sessions', async () => {
    const session = makeSession({ name: 'Old Session' });
    mockedAxios.get.mockResolvedValueOnce({ data: [session] });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['dormant', '--days', '7']);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3000/sessions/dormant',
      { params: { days: 7 } }
    );
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('more than 7 day(s)'));
    spy.mockRestore();
  });

  it('prints nothing found message when list is empty', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['dormant', '--days', '30']);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No sessions inactive'));
    spy.mockRestore();
  });

  it('outputs JSON when --json flag is set', async () => {
    const sessions = [makeSession()];
    mockedAxios.get.mockResolvedValueOnce({ data: sessions });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(['dormant', '--json']);

    expect(spy).toHaveBeenCalledWith(JSON.stringify(sessions, null, 2));
    spy.mockRestore();
  });

  it('exits with error on invalid days', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['dormant', '--days', 'abc'])).rejects.toThrow('process.exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    spy.mockRestore();
  });

  it('exits on server error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('connect refused'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runCommand(['dormant'])).rejects.toThrow('process.exit');
    expect(mockExit).toHaveBeenCalledWith(1);
    spy.mockRestore();
  });

  it('printDormantSession formats correctly', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const session = makeSession({ id: 'xyz', name: 'My Session', tabs: [{url:'a',title:'A'},{url:'b',title:'B'}] });
    printDormantSession(session);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('My Session'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('2 tab(s)'));
    spy.mockRestore();
  });
});
