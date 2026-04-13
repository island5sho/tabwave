import { Router } from "express";
import { SessionStore } from "../storage/session-store";

export function registerBookmarkRoute(router: Router, store: SessionStore): void {
  // List bookmarks
  router.get("/sessions/:id/bookmarks", async (req, res) => {
    const session = await store.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    const bookmarks = (session as any).bookmarks || [];
    return res.json({ bookmarks });
  });

  // Add bookmark
  router.post("/sessions/:id/bookmarks", async (req, res) => {
    const session = await store.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { url, label } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }

    const bookmarks: { url: string; label?: string }[] = (session as any).bookmarks || [];
    const exists = bookmarks.some((b) => b.url === url);
    if (exists) {
      return res.status(409).json({ error: "Bookmark already exists" });
    }

    const entry: { url: string; label?: string } = { url };
    if (label) entry.label = label;
    bookmarks.push(entry);

    await store.save({ ...session, bookmarks } as any);
    return res.status(201).json({ bookmarks });
  });

  // Remove bookmark
  router.delete("/sessions/:id/bookmarks", async (req, res) => {
    const session = await store.get(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });

    const bookmarks: { url: string; label?: string }[] = (session as any).bookmarks || [];
    const updated = bookmarks.filter((b) => b.url !== url);

    if (updated.length === bookmarks.length) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    await store.save({ ...session, bookmarks: updated } as any);
    return res.json({ bookmarks: updated });
  });
}
