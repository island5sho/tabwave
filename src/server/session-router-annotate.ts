import { Router } from "express";
import { SessionStore } from "../storage/session-store";

export function registerAnnotateRoute(router: Router, store: SessionStore): void {
  router.patch("/sessions/:id/annotate", async (req, res) => {
    const { id } = req.params;
    const { annotation } = req.body as { annotation?: string };

    if (annotation === undefined) {
      res.status(400).json({ error: "Missing 'annotation' field in request body" });
      return;
    }

    const session = await store.get(id);
    if (!session) {
      res.status(404).json({ error: `Session "${id}" not found` });
      return;
    }

    const updated = {
      ...session,
      annotation: annotation.trim(),
      updatedAt: new Date().toISOString(),
    };

    await store.save(updated);
    res.json(updated);
  });
}
