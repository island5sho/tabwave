import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_ARCHIVE_DIR = path.join(process.env.HOME || '.', '.tabwave', 'archives');

export function registerArchiveRoute(router: Router, store: SessionStore): void {
  router.post('/sessions/:id/archive', async (req: Request, res: Response) => {
    const { id } = req.params;
    const archiveDir: string = req.body?.dir || DEFAULT_ARCHIVE_DIR;

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: `Session "${id}" not found.` });
    }

    try {
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${session.name || id}-${timestamp}.json`;
      const filepath = path.join(archiveDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(session, null, 2), 'utf-8');

      const keep = req.body?.keep === true;
      if (!keep) {
        await store.delete(id);
      }

      return res.status(200).json({ archived: filepath, removed: !keep });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to archive session.', detail: err.message });
    }
  });
}
