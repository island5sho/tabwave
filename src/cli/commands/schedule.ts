import { Command } from 'commander';
import axios from 'axios';
import { Schedule } from '../../types/session';

const BASE_URL = process.env.TABWAVE_SERVER ?? 'http://localhost:3000';

export function formatSchedule(s: Schedule): string {
  const active = s.enabled ? '✓' : '✗';
  return `[${active}] ${s.sessionId} — cron: "${s.cron}" action: ${s.action}`;
}

export function createScheduleCommand(): Command {
  const cmd = new Command('schedule');

  cmd
    .command('set <sessionId>')
    .description('Set a cron schedule for a session action')
    .requiredOption('-c, --cron <expr>', 'Cron expression (e.g. "0 9 * * 1")')
    .requiredOption('-a, --action <action>', 'Action to perform: push | pull | archive')
    .action(async (sessionId: string, opts: { cron: string; action: string }) => {
      try {
        const res = await axios.post(`${BASE_URL}/sessions/${sessionId}/schedule`, {
          cron: opts.cron,
          action: opts.action,
        });
        console.log(`Schedule set: ${formatSchedule(res.data)}`);
      } catch (e: any) {
        console.error(e.response?.data?.error ?? e.message);
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List all active schedules')
    .action(async () => {
      try {
        const res = await axios.get(`${BASE_URL}/schedules`);
        const schedules: Schedule[] = res.data;
        if (!schedules.length) {
          console.log('No schedules configured.');
          return;
        }
        schedules.forEach((s) => console.log(formatSchedule(s)));
      } catch (e: any) {
        console.error(e.response?.data?.error ?? e.message);
        process.exit(1);
      }
    });

  cmd
    .command('remove <sessionId>')
    .description('Remove the schedule for a session')
    .action(async (sessionId: string) => {
      try {
        await axios.delete(`${BASE_URL}/sessions/${sessionId}/schedule`);
        console.log(`Schedule removed for session: ${sessionId}`);
      } catch (e: any) {
        console.error(e.response?.data?.error ?? e.message);
        process.exit(1);
      }
    });

  return cmd;
}
