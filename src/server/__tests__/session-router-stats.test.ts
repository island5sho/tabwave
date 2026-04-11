import express from "express";
import request from "supertest";
import { registerStatsRoute } from "../session-router-stats";
import { SessionStore } from "../../storage/session-store";
import { TabSession } from "../../types/session";

const mockSessions: TabSession[] = [
  {
    id: "s1",
    name: "Alpha",
    tabs: [
      { url: "https://x.com", title: "X" },
      { url: "https://y.com", title: "Y" },
    ],
    tags: ["research"],
    pinned: false,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "s2",
    name: "Beta",
    tabs: [],
    tags: [],
    pinned: true,
    archived: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function buildApp(store: Partial<SessionStore>) {
  const app = express();
  app.use(express.json());
  const router = express.Router();
  registerStatsRoute(router, store as SessionStore);
  app.use(router);
  return app;
}

describe("GET /sessions/stats", () => {
  it("returns computed stats for all sessions", async () => {
    const store = { getAll: jest.fn().mockResolvedValue(mockSessions) };
    const app = buildApp(store);
    const res = await request(app).get("/sessions/stats");
    expect(res.status).toBe(200);
    expect(res.body.totalSessions).toBe(2);
    expect(res.body.totalTabs).toBe(2);
    expect(res.body.archivedSessions).toBe(1);
    expect(res.body.pinnedSessions).toBe(1);
    expect(res.body.taggedSessions).toBe(1);
    expect(res.body.avgTabsPerSession).toBe(1);
    expect(res.body.mostUsedTags).toEqual([{ tag: "research", count: 1 }]);
  });

  it("returns zeros for empty store", async () => {
    const store = { getAll: jest.fn().mockResolvedValue([]) };
    const app = buildApp(store);
    const res = await request(app).get("/sessions/stats");
    expect(res.status).toBe(200);
    expect(res.body.totalSessions).toBe(0);
    expect(res.body.mostUsedTags).toHaveLength(0);
  });

  it("returns 500 on store error", async () => {
    const store = { getAll: jest.fn().mockRejectedValue(new Error("DB error")) };
    const app = buildApp(store);
    const res = await request(app).get("/sessions/stats");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Failed to compute stats");
  });
});
