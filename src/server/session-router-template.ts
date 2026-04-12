import { Router } from 'express';
import { SessionStore } from '../storage/session-store';
import { SessionTemplate } from '../cli/commands/template';
import { v4 as uuidv4 } from 'uuid';

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

export function registerTemplateRoute(router: Router, store: SessionStore): void {
  router.get('/templates', (_req, res) => {
    const list = Object.entries(BUILT_IN_TEMPLATES).map(([key, tpl]) => ({
      key,
      tabCount: tpl.urls.length,
      tags: tpl.tags || [],
    }));
    res.json(list);
  });

  router.post('/templates/:name/apply', (req, res) => {
    const tpl = BUILT_IN_TEMPLATES[req.params.name];
    if (!tpl) {
      return res.status(404).json({ error: `Template '${req.params.name}' not found` });
    }

    const sessionName: string = req.body.name || tpl.name;
    const now = new Date().toISOString();
    const session = {
      id: uuidv4(),
      name: sessionName,
      tabs: tpl.urls.map((url, i) => ({ id: `tab-${i}`, url, title: url })),
      tags: tpl.tags || [],
      pinned: false,
      archived: false,
      locked: false,
      createdAt: now,
      updatedAt: now,
    };

    store.save(session);
    res.status(201).json(session);
  });
}
