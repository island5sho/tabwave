import axios from 'axios';
import { formatSchedule, createScheduleCommand } from '../commands/schedule';
import { Schedule } from '../../types/session';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockSchedule: Schedule = {
  sessionId: 'abc123',
  cron: '0 9 * * 1',
  action: 'push',
  enabled: true,
};

describe('formatSchedule', () => {
  it('formats an enabled schedule correctly', () => {
    const line = formatSchedule(mockSchedule);
    expect(line).toContain('[✓]');
    expect(line).toContain('abc123');
    expect(line).toContain('0 9 * * 1');
    expect(line).toContain('push');
  });

  it('formats a disabled schedule correctly', () => {
    const line = formatSchedule({ ...mockSchedule, enabled: false });
    expect(line).toContain('[✗]');
  });
});

describe('schedule set', () => {
  it('posts schedule and logs result', async () => {
    mockedAxios.post = jest.fn().mockResolvedValue({ data: mockSchedule });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const cmd = createScheduleCommand();
    await cmd.parseAsync(['node', 'tabwave', 'set', 'abc123', '-c', '0 9 * * 1', '-a', 'push']);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/sessions/abc123/schedule'),
      { cron: '0 9 * * 1', action: 'push' }
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('push'));
    consoleSpy.mockRestore();
  });

  it('exits on server error', async () => {
    mockedAxios.post = jest.fn().mockRejectedValue({ response: { data: { error: 'Not found' } } });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const cmd = createScheduleCommand();
    await expect(
      cmd.parseAsync(['node', 'tabwave', 'set', 'abc123', '-c', '0 9 * * 1', '-a', 'push'])
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});

describe('schedule list', () => {
  it('lists schedules', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: [mockSchedule] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const cmd = createScheduleCommand();
    await cmd.parseAsync(['node', 'tabwave', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    consoleSpy.mockRestore();
  });

  it('shows empty message when no schedules', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: [] });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const cmd = createScheduleCommand();
    await cmd.parseAsync(['node', 'tabwave', 'list']);
    expect(consoleSpy).toHaveBeenCalledWith('No schedules configured.');
    consoleSpy.mockRestore();
  });
});

describe('schedule remove', () => {
  it('deletes schedule and logs confirmation', async () => {
    mockedAxios.delete = jest.fn().mockResolvedValue({ data: { message: 'Schedule removed' } });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const cmd = createScheduleCommand();
    await cmd.parseAsync(['node', 'tabwave', 'remove', 'abc123']);
    expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('/sessions/abc123/schedule'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    consoleSpy.mockRestore();
  });
});
