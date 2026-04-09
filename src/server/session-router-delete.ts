import { Router, Request, Response } from 'express';
import { SessionStore } from '../storage/session-store';

/**
 * Registers the DELETE /sessions/:id route on an existing router.
 * Separated for clarity and testability.
 */
export function registerDeleteRoute(router: Router, store: SessionStore): void {
  router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const existing = await store.get(id);

      if (!existing) {
        res.status(404).json({ error: `Session "${id}" not found.` });
        return;
      }

      await store.delete(id);
      res.status(200).json({ message: `Session "${id}" deleted.`, id });
    } catch (err: any) {
      console.error(`[delete] Error deleting session ${id}:`, err.message);
      res.status(500).json({ error: 'Internal server error while deleting session.' });
    }
  });
}
