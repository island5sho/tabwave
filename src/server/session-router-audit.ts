import { Router } from "express";
import { SessionStore } from "../storage/session-store";
import { AuditResult } from "../cli/commands/audit";
import { Tab } from "../types/session";

function auditSession(id: string, name: string, tabs: Tab[], fix: boolean): { result: AuditResult; tabs: Tab[] } {
  const issues: string[] = [];
  let updatedTabs = [...tabs];

  if (tabs.length === 0) {
    issues.push("Session has no tabs.");
  }

  const urlCounts = new Map<string, number>();
  tabs.forEach((t) => urlCounts.set(t.url, (urlCounts.get(t.url) ?? 0) + 1));
  const duplicateUrls = [...urlCounts.entries()].filter(([, count]) => count > 1).map(([url]) => url);

  if (duplicateUrls.length > 0) {
    issues.push(`Duplicate tab URL(s): ${duplicateUrls.join(", ")}`);
    if (fix) {
      const seen = new Set<string>();
      updatedTabs = tabs.filter((t) => {
        if (seen.has(t.url)) return false;
        seen.add(t.url);
        return true;
      });
    }
  }

  const blankTabs = tabs.filter((t) => !t.url || t.url.trim() === "");
  if (blankTabs.length > 0) {
    issues.push(`${blankTabs.length} tab(s) have empty URLs.`);
  }

  return { result: { sessionId: id, name, issues }, tabs: updatedTabs };
}

export function registerAuditRoute(router: Router, store: SessionStore): void {
  router.get("/sessions/audit", async (req, res) => {
    const { id, fix } = req.query as { id?: string; fix?: string };
    const shouldFix = fix === "true";

    const sessions = await store.getAll();
    const targets = id ? sessions.filter((s) => s.id === id) : sessions;

    if (id && targets.length === 0) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const results: AuditResult[] = [];

    for (const session of targets) {
      const { result, tabs } = auditSession(session.id, session.name, session.tabs, shouldFix);
      results.push(result);
      if (shouldFix && tabs.length !== session.tabs.length) {
        await store.save({ ...session, tabs, updatedAt: new Date().toISOString() });
      }
    }

    res.json({ results });
  });
}
