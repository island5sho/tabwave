import { Router } from "express";
import { SessionStore } from "../storage/session-store";

export function registerFavoriteRoute(router: Router, store: SessionStore): void {
  router.patch("/sessions/:id/favorite", async (req, res) => {
    const { id } = req.params;
    const { favorite } = req.body as { favorite?: boolean };

    if (typeof favorite !== "boolean") {
      res.status(400).json({ error: "'favorite' must be a boolean" });
      return;
    }

    const session = await store.get(id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const updated = { ...session, favorite, updatedAt: new Date().toISOString() };
    await store.save(updated);
    res.json(updated);
  });

  router.get("/sessions/favorites", async (_req, res) => {
    const all = await store.list();
    const favorites = all.filter((s) => s.favorite === true);
    res.json(favorites);
  });
}
