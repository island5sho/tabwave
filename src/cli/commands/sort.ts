import { Command } from 'commander';
import axios from 'axios';
import { TabSession } from '../../types/session';

type SortField = 'name' | 'createdAt' | 'updatedAt' | 'tabCount';
type SortOrder = 'asc' | 'desc';

export function sortSessions(
  sessions: TabSession[],
  field: SortField,
  order: SortOrder
): TabSession[] {
  return [...sessions].sort((a, b) => {
    let valA: string | number;
    let valB: string | number;

    switch (field) {
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'createdAt':
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        valA = new Date(a.updatedAt).getTime();
        valB = new Date(b.updatedAt).getTime();
        break;
      case 'tabCount':
        valA = a.tabs.length;
        valB = b.tabs.length;
        break;
      default:
        return 0;
    }

    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function createSortCommand(): Command {
  const cmd = new Command('sort');

  cmd
    .description('List sessions sorted by a given field')
    .option('-f, --field <field>', 'Sort field: name | createdAt | updatedAt | tabCount', 'updatedAt')
    .option('-o, --order <order>', 'Sort order: asc | desc', 'desc')
    .option('-p, --port <port>', 'Server port', '3000')
    .action(async (opts) => {
      const { field, order, port } = opts;
      const validFields: SortField[] = ['name', 'createdAt', 'updatedAt', 'tabCount'];
      const validOrders: SortOrder[] = ['asc', 'desc'];

      if (!validFields.includes(field as SortField)) {
        console.error(`Invalid field "${field}". Choose from: ${validFields.join(', ')}`);
        process.exit(1);
      }

      if (!validOrders.includes(order as SortOrder)) {
        console.error(`Invalid order "${order}". Choose from: asc, desc`);
        process.exit(1);
      }

      try {
        const res = await axios.get(`http://localhost:${port}/sessions`);
        const sessions: TabSession[] = res.data;

        if (sessions.length === 0) {
          console.log('No sessions found.');
          return;
        }

        const sorted = sortSessions(sessions, field as SortField, order as SortOrder);
        sorted.forEach((s) => {
          const tabCount = s.tabs.length;
          const updated = new Date(s.updatedAt).toLocaleString();
          console.log(`[${s.id}] ${s.name} — ${tabCount} tab(s) — updated ${updated}`);
        });
      } catch {
        console.error('Failed to connect to tabwave server.');
        process.exit(1);
      }
    });

  return cmd;
}
