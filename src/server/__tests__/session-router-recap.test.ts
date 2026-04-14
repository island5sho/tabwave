import express from "express";
import request from "supertest";
import { registerRecapRoute } from "../session-router-recap";
import { SessionStore } from "../../storage/session-store";
import { TabSession } from "../../types/session";

function makeSession(
  name: string,
  tabCount: number,
  overrides: Partial<TabSession> = {}
): TabSession {
  return {
    id: name,
    name,
    tabs: Array.from({ length: tabCount }, (_, i) => ({
      url: `https://example.com/${i}`,
      title: `Tab ${i}`,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
    archived: false,
    tags: [],
    ...overrides,
  };
}

function buildApp(sessions: TabSession[]) {
  const store = { getAll: jest.fn().mockResolvedValue(sessions) } as unknown as SessionStore;
  const app = express();
  const router = express.Router();
  registerRecapRoute(router, store);
  app.use(router);
  return app;
}

describe("GET /sessions/recap", () => {
  it("returns recap stats for multiple sessions", async () => {
    const sessions = [
      makeSession("work", 5, { pinned: true, tags: ["dev"] }),
      makeSession("home", 3, { archived: true }),
    ];
    const res = await request(buildApp(sessions)).get("/sessions/recap");
    expect(res.status).toBe(200);
    expect(res.body.totalSessions).toBe(2);
    expect(res.body.totalTabs).toBe(8);
    expect(res.body.pinned).toBe(1);
    expect(res.body.archived).toBe(1);
    expect(res.body.tagged).toBe(1);
    expect(res.body.avgTabsPerSession).toBe(4.0);
    expect(res.body.topSession).toEqual({ name: "work", tabCount: 5 });
  });

  it("returns zero stats for empty store", async () => {
    const res = await request(buildApp([])).get("/sessions/recap");
    expect(res.status).toBe(200);
    expect(res.body.totalSessions).toBe(0);
    expect(res.body.totalTabs).toBe(0);
    expect(res.body.topSession).toBeNull();
  });

  it("returns 500 on store error", async () => {
    const store = {
      getAll: jest.fn().mockRejectedValue(new Error("DB error")),
    } as unknown as SessionStore;
    const app = express();
    const router = express.Router();
    registerRecapRoute(router, store);
    app.use(router);
    const res = await request(app).get("/sessions/recap");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("DB error");
  });
});
