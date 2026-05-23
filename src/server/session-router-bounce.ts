import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerBounceRoute(router: Router, store: SessionStore): void {
  router.post('/:id/bounce', async (req, res) => {
    const { id } = req.params;
    const delayMs = parseInt((req.query.delay as string) ?? '0', 10);

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: `Session "${id}" not found` });
    }

    // Deactivate
    const deactivated = { ...session, active: false, updatedAt: new Date().toISOString() };
    await store.save(deactivated);

    // Optional server-side delay (capped at 2 s to prevent abuse)
    const safDelay = Math.min(delayMs, 2000);
    if (safDelay > 0) {
      await new Promise((r) => setTimeout(r, safDelay));
    }

    // Reactivate
    const reactivated = { ...deactivated, active: true, updatedAt: new Date().toISOString() };
    await store.save(reactivated);

    return res.json({ success: true, session: reactivated });
  });
}
