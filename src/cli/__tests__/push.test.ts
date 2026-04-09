import axios from 'axios';
import * as fs from 'fs';
import { pushSession } from '../commands/push';
import { Session } from '../../types/session';

jest.mock('axios');
jest.mock('fs');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;

const mockSession: Session = {
  id: 'session-abc',
  deviceId: 'device-old',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tabs: [
    { id: 'tab-1', url: 'https://example.com', title: 'Example', pinned: false, index: 0 },
  ],
};

describe('pushSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedFs.existsSync as jest.Mock).mockReturnValue(true);
    (mockedFs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockSession));
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(false) as any;
  });

  it('pushes a valid session from file to the server', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 201, data: {} });

    await expect(
      pushSession({ file: './session.json', deviceId: 'device-123' })
    ).resolves.toBeUndefined();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:3000/sessions',
      expect.objectContaining({ id: 'session-abc', deviceId: 'device-123' }),
      expect.any(Object)
    );
  });

  it('throws if the session file does not exist', async () => {
    (mockedFs.existsSync as jest.Mock).mockReturnValue(false);

    await expect(
      pushSession({ file: './missing.json', deviceId: 'device-123' })
    ).rejects.toThrow('Session file not found');
  });

  it('throws if no file option is provided', async () => {
    await expect(
      pushSession({ deviceId: 'device-123' })
    ).rejects.toThrow('No session source provided');
  });

  it('throws a descriptive error on axios failure', async () => {
    const axiosError = { isAxiosError: true, message: 'Network Error', response: { data: { error: 'Server unavailable' } } };
    mockedAxios.post.mockRejectedValueOnce(axiosError);
    (mockedAxios.isAxiosError as jest.Mock).mockReturnValue(true);

    await expect(
      pushSession({ file: './session.json', deviceId: 'device-123' })
    ).rejects.toThrow('Failed to push session: Server unavailable');
  });

  it('uses a custom server URL when provided', async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

    await pushSession({ file: './session.json', deviceId: 'device-123', serverUrl: 'http://192.168.1.10:4000' });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://192.168.1.10:4000/sessions',
      expect.any(Object),
      expect.any(Object)
    );
  });
});
