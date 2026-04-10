import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import { TabSession } from '../types/session';

export function registerSearchRoute(
  router: Router,
  store: SessionStore
): void {
  router.get('/sessions/search', (req: Request, res: Response) => {
    const { title, url, tag } = req.query as Record<string, string | undefined>;

    if (!title && !url && !tag) {
      res.status(400).json({
        error: 'Provide at least one query param: title, url, or tag',
      });
      return;
    }

    const all: TabSession[] = store.getAll();

    const results = all.filter((session) => {
      if (tag && !(session.tags ?? []).includes(tag)) return false;

      if (title || url) {
        const titleLower = title?.toLowerCase();
        const urlLower = url?.toLowerCase();
        const matched = session.tabs.some((tab) => {
          if (titleLower && !tab.title.toLowerCase().includes(titleLower))
            return false;
          if (urlLower && !tab.url.toLowerCase().includes(urlLower))
            return false;
          return true;
        });
        if (!matched) return false;
      }

      return true;
    });

    res.json(results);
  });
}
