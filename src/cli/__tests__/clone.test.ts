import axios from 'axios';
import { createCloneCommand } from '../commands/clone';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSession = {
  id: 'abc-123',
  name: 'Work Tabs',
  tabs: [
    { id: 't1', url: 'https://example.com', title: 'Example' },
    { id: 't2', url: 'https://github.com', title: 'GitHub' },
  ],
  tags: ['work'],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const exitSpy = jest.spyOn(process, 'exit').mockImplementation((_code?: any) => { throw new Error('exit'); });

afterEach(() => jest.clearAllMocks());

describe('clone command', () => {
  it('clones a session from a remote server', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockSession });
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { ...mockSession, id: 'new-456', name: 'Work Tabs (clone)' },
    });

    const cmd = createCloneCommand();
    await cmd.parseAsync(['http://remote:3000', 'abc-123'], { from: 'user' });

    expect(mockedAxios.get).toHaveBeenCalledWith('http://remote:3000/sessions/abc-123');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions'),
      expect.objectContaining({ name: 'Work Tabs (clone)', tabs: mockSession.tabs })
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('cloned successfully'));
  });

  it('overrides name when --name flag is provided', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockSession });
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { ...mockSession, id: 'new-789', name: 'My Custom Name' },
    });

    const cmd = createCloneCommand();
    await cmd.parseAsync(['http://remote:3000', 'abc-123', '--name', 'My Custom Name'], { from: 'user' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ name: 'My Custom Name' })
    );
  });

  it('strips tags when --no-tags flag is provided', async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: mockSession });
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { ...mockSession, id: 'new-000', tags: [] },
    });

    const cmd = createCloneCommand();
    await cmd.parseAsync(['http://remote:3000', 'abc-123', '--no-tags'], { from: 'user' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ tags: [] })
    );
  });

  it('exits with error when remote fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const cmd = createCloneCommand();
    await expect(
      cmd.parseAsync(['http://remote:3000', 'bad-id'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Clone failed'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
