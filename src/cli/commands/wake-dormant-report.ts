import axios from 'axios';
import { Command } from 'commander';
import { buildDormantReport, printDormantReport } from './dormant-report';

export interface WakeDormantReportResult {
  woken: string[];
  skipped: string[];
  total: number;
}

export function printWakeDormantReportResult(result: WakeDormantReportResult): void {
  if (result.woken.length === 0) {
    console.log('No dormant sessions were woken.');
    return;
  }
  console.log(`Woken ${result.woken.length} of ${result.total} dormant session(s):`);
  for (const id of result.woken) {
    console.log(`  ✓ ${id}`);
  }
  if (result.skipped.length > 0) {
    console.log(`Skipped ${result.skipped.length} session(s) (protected or locked).`);
  }
}

export function createWakeDormantReportCommand(): Command {
  return new Command('wake-dormant-report')
    .description('Wake all dormant sessions and print a summary report')
    .option('--port <port>', 'server port', '3000')
    .option('--host <host>', 'server host', 'localhost')
    .option('--dry-run', 'preview which sessions would be woken without making changes')
    .action(async (opts) => {
      const base = `http://${opts.host}:${opts.port}`;
      try {
        if (opts.dryRun) {
          const res = await axios.get(`${base}/sessions/dormant-report`);
          console.log('[dry-run] Dormant report:');
          printDormantReport(buildDormantReport(res.data.sessions ?? []));
          return;
        }
        const res = await axios.post(`${base}/sessions/wake-dormant-report`);
        printWakeDormantReportResult(res.data);
      } catch (err: any) {
        console.error('Error:', err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
}
