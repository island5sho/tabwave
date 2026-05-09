import { Router } from 'express';
import { SessionStore } from '../storage/session-store';

export function registerHighlightRoute(router: Router, store: SessionStore): void {
  router.post('/:id/highlight', async (req, res) => {
    const { id } = req.params;
    const { tabIndex } = req.body;

    if (typeof tabIndex !== 'number' || tabIndex < 0) {
      return res.status(400).json({ error: 'tabIndex must be a non-negative number' });
    }

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (tabIndex >= session.tabs.length) {
      return res.status(400).json({ error: `Tab index ${tabIndex} out of range` });
    }

    const updatedTabs = session.tabs.map((tab, i) => ({
      ...tab,
      highlighted: i === tabIndex ? true : tab.highlighted,
    }));

    const updated = { ...session, tabs: updatedTabs, updatedAt: new Date().toISOString() };
    await store.save(updated);

    return res.json({ tab: updatedTabs[tabIndex] });
  });

  router.delete('/:id/highlight/:tabIndex', async (req, res) => {
    const { id } = req.params;
    const tabIndex = parseInt(req.params.tabIndex, 10);

    const session = await store.get(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (isNaN(tabIndex) || tabIndex < 0 || tabIndex >= session.tabs.length) {
      return res.status(400).json({ error: 'Invalid tab index' });
    }

    const updatedTabs = session.tabs.map((tab, i) =>
      i === tabIndex ? { ...tab, highlighted: false } : tab
    );

    const updated = { ...session, tabs: updatedTabs, updatedAt: new Date().toISOString() };
    await store.save(updated);

    return res.json({ tab: updatedTabs[tabIndex] });
  });
}
