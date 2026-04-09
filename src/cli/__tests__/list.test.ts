import axios from 'axios';
import chalk from 'chalk';
import { listSessions } from '../commands/list';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSessions = [
  {
    id: 'session-1',
    deviceName: 'laptop',
    tabs: [
      { id: 'tab-1', url: 'https://example.com', title: 'Example', active: true },
      { id: 'tab-2', url: 'https://github.com', title: 'GitHub', active: false },
    ],
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-02T12:00:00.000Z',
  },
  {
    id: 'session-2',
    deviceName: 'desktop',
    tabs: [
      { id: 'tab-3', url: 'https://news.ycombinator.com', title: 'HN', active: true },
    ],
    createdAt: '2024-01-03T08:00:00.000Z',
    updatedAt: '2024-01-03T09:00:00.000Z',
  },
];

describe('listSessions', () => {
  let consoleSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists sessions returned by the server', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockSessions });
    await listSessions({ host: 'localhost', port: 3000 });
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/sessions');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 session(s)'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('session-1'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('session-2'));
  });

  it('prints tab details in verbose mode', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockSessions });
    await listSessions({ verbose: true });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('https://example.com'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('https://github.com'));
  });

  it('shows a message when no sessions exist', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    await listSessions();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No sessions found'));
  });

  it('exits with error when server is unreachable', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(listSessions()).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
