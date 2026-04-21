import { Router } from "express";
import { SessionStore } from "../storage/session-store";

export function registerUntagRoute(router: Router, store: SessionStore): void {
  router.patch("/sessions/:id/untag", async (req, res) => {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      res.status(400).json({ error: "tags must be a non-empty array" });
      return;
    }

    const session = await store.get(id);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const existingTags: string[] = session.tags ?? [];
    const tagsToRemove = new Set<string>(tags);
    const updatedTags = existingTags.filter((t) => !tagsToRemove.has(t));

    const updated = {
      ...session,
      tags: updatedTags,
      updatedAt: new Date().toISOString(),
    };

    await store.save(updated);
    res.status(200).json({ tags: updatedTags });
  });
}
