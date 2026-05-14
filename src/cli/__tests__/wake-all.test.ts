import axios from 'axios';
import { createWakeAllCommand } from '../commands/wake-all';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleErr = jest.spyOn(console, 'error').mockImplementation(() => {});

async function runCommand(args: string[]) {
  const cmd = createWakeAllCommand();
  await cmd.parseAsync(['node', 'wake-all', ...args]);
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('wakes all frozen sessions', async () => {
  mockedAxios.get.mockResolvedValue({
    data: [
      { id: 's1', name: 'Alpha', frozen: true },
      { id: 's2', name: 'Beta', frozen: false },
      { id: 's3', name: 'Gamma', frozen: true },
    ],
  });
  mockedAxios.post.mockResolvedValue({ data: {} });

  await runCommand([]);

  expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/s1/wake');
  expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3000/sessions/s3/wake');
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Woken: 2'));
});

test('reports no frozen sessions', async () => {
  mockedAxios.get.mockResolvedValue({
    data: [{ id: 's1', name: 'Alpha', frozen: false }],
  });

  await runCommand([]);

  expect(consoleSpy).toHaveBeenCalledWith('No frozen sessions found.');
  expect(mockedAxios.post).not.toHaveBeenCalled();
});

test('dry-run lists sessions without waking', async () => {
  mockedAxios.get.mockResolvedValue({
    data: [{ id: 's1', name: 'Alpha', frozen: true }],
  });

  await runCommand(['--dry-run']);

  expect(mockedAxios.post).not.toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Would wake 1'));
});

test('exits when server unreachable', async () => {
  mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));

  await runCommand([]);

  expect(mockExit).toHaveBeenCalledWith(1);
  expect(consoleErr).toHaveBeenCalledWith('Could not reach tabwave server.');
});

test('counts failed wakes', async () => {
  mockedAxios.get.mockResolvedValue({
    data: [
      { id: 's1', name: 'Alpha', frozen: true },
      { id: 's2', name: 'Beta', frozen: true },
    ],
  });
  mockedAxios.post
    .mockResolvedValueOnce({ data: {} })
    .mockRejectedValueOnce(new Error('fail'));

  await runCommand([]);

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Woken: 1, Failed: 1'));
});
