import axios from 'axios';
import { createCleanCommand } from '../commands/clean';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const runCommand = async (args: string[]) => {
  const cmd = createCleanCommand();
  await cmd.parseAsync(['node', 'clean', ...args]);
};

const mockProcessExit = () => {
  const spy = jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit called');
  });
  return spy;
};

beforeEach(() => jest.clearAllMocks());

test('prints removed sessions on success', async () => {
  mockedAxios.post.mockResolvedValue({ data: { removed: ['abc', 'def'], previewed: [] } });
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});

  await runCommand(['--archived']);

  expect(mockedAxios.post).toHaveBeenCalledWith(
    'http://localhost:3000/sessions/clean',
    expect.objectContaining({ archived: true })
  );
  expect(log).toHaveBeenCalledWith(expect.stringContaining('Removed 2 session(s):'));
  log.mockRestore();
});

test('prints dry-run preview without deleting', async () => {
  mockedAxios.post.mockResolvedValue({ data: { removed: [], previewed: ['xyz'] } });
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});

  await runCommand(['--archived', '--dry-run']);

  expect(log).toHaveBeenCalledWith(expect.stringContaining('Would remove 1 session(s):'));
  log.mockRestore();
});

test('prints message when no sessions matched', async () => {
  mockedAxios.post.mockResolvedValue({ data: { removed: [], previewed: [] } });
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});

  await runCommand(['--older-than', '30']);

  expect(log).toHaveBeenCalledWith('No sessions matched the clean criteria.');
  log.mockRestore();
});

test('exits with error on server failure', async () => {
  mockedAxios.post.mockRejectedValue({ message: 'Network Error', response: undefined });
  const exit = mockProcessExit();
  const err = jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(runCommand(['--archived'])).rejects.toThrow('process.exit called');
  expect(exit).toHaveBeenCalledWith(1);

  exit.mockRestore();
  err.mockRestore();
});
