import { Command } from 'commander';
import axios from 'axios';
import { Session } from '../../types/session';

const BASE_URL = process.env.TABWAVE_URL || 'http://localhost:3000';

export interface SessionTemplate {
  name: string;
  urls: string[];
  tags?: string[];
}

const BUILT_IN_TEMPLATES: Record<string, SessionTemplate> = {
  dev: {
    name: 'dev',
    urls: ['http://localhost:3000', 'http://localhost:8080', 'https://github.com'],
    tags: ['dev'],
  },
  research: {
    name: 'research',
    urls: ['https://scholar.google.com', 'https://arxiv.org', 'https://wikipedia.org'],
    tags: ['research'],
  },
  social: {
    name: 'social',
    urls: ['https://twitter.com', 'https://reddit.com', 'https://news.ycombinator.com'],
    tags: ['social'],
  },
};

export function listTemplates(): void {
  console.log('Available templates:');
  for (const [key, tpl] of Object.entries(BUILT_IN_TEMPLATES)) {
    console.log(`  ${key.padEnd(12)} ${tpl.urls.length} tabs  [${(tpl.tags || []).join(', ')}]`);
  }
}

export function createTemplateCommand(): Command {
  const cmd = new Command('template');
  cmd.description('Create a session from a predefined template');

  cmd
    .command('list')
    .description('List available templates')
    .action(() => listTemplates());

  cmd
    .command('apply <templateName> <sessionName>')
    .description('Apply a template to create a new session')
    .action(async (templateName: string, sessionName: string) => {
      const tpl = BUILT_IN_TEMPLATES[templateName];
      if (!tpl) {
        console.error(`Unknown template: ${templateName}`);
        console.error(`Run 'tabwave template list' to see available templates.`);
        process.exit(1);
      }

      const session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'> = {
        name: sessionName,
        tabs: tpl.urls.map((url, i) => ({ id: `tab-${i}`, url, title: url })),
        tags: tpl.tags || [],
        pinned: false,
        archived: false,
        locked: false,
      };

      try {
        const res = await axios.post(`${BASE_URL}/sessions`, session);
        console.log(`Session '${sessionName}' created from template '${templateName}' (id: ${res.data.id})`);
      } catch (err: any) {
        console.error('Failed to create session:', err.response?.data?.error || err.message);
        process.exit(1);
      }
    });

  return cmd;
}
