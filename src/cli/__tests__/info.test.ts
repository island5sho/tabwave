import axios from 'axios';
import { Command } from 'commander';
import { printInfo, createInfoCommand } from '../commands/info';
import { TabSession } from '../../types/session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeSession(overrides: Partial<TabSession> = {}): TabSession {
  return {
    id: 'abc123',
    name: 'My Session',
    tabs: [
      { url: 'https://example.com', title: 'Example' },
      { url: 'https://github.com', title: 'GitHub' },
    ],
    createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-02T12:00:00Z').toISOString(),
    tags: [],
    ...overrides,
  } as TabSession;
}

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createInfoCommand('http://localhost:3000'));
  await program.parseAsync(['node', 'tabwave', ...args]);
}

describe('printInfo', () => {
  it('prints basic session fields', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printInfo(makeSession());
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('My Session'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('2'));
    spy.mockRestore();
  });

  it('prints tags when present', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printInfo(makeSession({ tags: ['work', 'research'] }));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('work, research'));
    spy.mockRestore();
  });

  it('prints note when present', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printInfo(makeSession({ note: 'important session' }));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('important session'));
    spy.mockRestore();
  });

  it('prints tab list', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    printInfo(makeSession());
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('https://example.com'));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('https://github.com'));
    spy.mockRestore();
  });
});

describe('createInfoCommand', () => {
  it('fetches and prints session info', async () => {
    const session = makeSession();
    mockedAxios.get.mockResolvedValueOnce({ data: session });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(['info', 'abc123']);
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/sessions/abc123');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    spy.mockRestore();
  });

  it('prints error on 404', async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 }, message: 'Not Found' });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runCommand(['info', 'missing'])).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
