import axios from 'axios';
import { Command } from 'commander';

export interface QuotaInfo {
  sessionCount: number;
  tabCount: number;
  maxSessions: number;
  maxTabs: number;
  storageBytes: number;
  maxStorageBytes: number;
}

export function printQuota(quota: QuotaInfo): void {
  const sessionPct = Math.round((quota.sessionCount / quota.maxSessions) * 100);
  const tabPct = Math.round((quota.tabCount / quota.maxTabs) * 100);
  const storagePct = Math.round((quota.storageBytes / quota.maxStorageBytes) * 100);

  console.log('Quota Usage:');
  console.log(`  Sessions : ${quota.sessionCount}/${quota.maxSessions} (${sessionPct}%)`);
  console.log(`  Tabs     : ${quota.tabCount}/${quota.maxTabs} (${tabPct}%)`);
  console.log(`  Storage  : ${formatBytes(quota.storageBytes)}/${formatBytes(quota.maxStorageBytes)} (${storagePct}%)`);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function createQuotaCommand(baseUrl: string): Command {
  const cmd = new Command('quota');
  cmd.description('Show storage and session quota usage');
  cmd.option('--json', 'Output as JSON');
  cmd.action(async (opts) => {
    try {
      const res = await axios.get(`${baseUrl}/quota`);
      const quota: QuotaInfo = res.data;
      if (opts.json) {
        console.log(JSON.stringify(quota, null, 2));
      } else {
        printQuota(quota);
      }
    } catch {
      console.error('Failed to fetch quota info');
      process.exit(1);
    }
  });
  return cmd;
}
