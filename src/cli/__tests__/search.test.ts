import axios from 'axios';
import { Command } from 'commander';
import { createSearchCommand } from '../commands/search';
import { TabSession } from '../../types/session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSessions: TabSession[] = [
  {
    id: 'abc',
    name: 'Work',
    tabs: [
      { title: 'GitHub', url: 'https://github.com', pinned: false },
      { title: 'Jira Board', url: 'https://jira.example.com', pinned: false },
    ],
    tags: ['work'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'def',
    name: 'Personal',
    tabs: [
      { title: 'YouTube', url: 'https://youtube.com', pinned: false },
    ],
    tags: ['personal'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function runCommand(args: string[]): Promise<void> {
  const program = new Command();
  program.addCommand(createSearchCommand());
  await program.parseAsync(['node', 'tabwave', ...args]);
}

beforeEach(() => jest.clearAllMocks());

test('filters sessions by title', async () => {
  mockedAxios.get.mockResolvedValue({ data: mockSessions });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runCommand(['search', '--title', 'github']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('1 session'));
  spy.mockRestore();
});

test('filters sessions by url', async () => {
  mockedAxios.get.mockResolvedValue({ data: mockSessions });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runCommand(['search', '--url', 'youtube']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('1 session'));
  spy.mockRestore();
});

test('filters sessions by tag', async () => {
  mockedAxios.get.mockResolvedValue({ data: mockSessions });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runCommand(['search', '--tag', 'work']);
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('1 session'));
  spy.mockRestore();
});

test('shows message when no sessions match', async () => {
  mockedAxios.get.mockResolvedValue({ data: mockSessions });
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  await runCommand(['search', '--title', 'nonexistent']);
  expect(spy).toHaveBeenCalledWith('No sessions matched your search.');
  spy.mockRestore();
});

test('exits with error when no filters provided', async () => {
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(runCommand(['search'])).rejects.toThrow('exit');
  expect(exitSpy).toHaveBeenCalledWith(1);
  exitSpy.mockRestore();
  errSpy.mockRestore();
});
