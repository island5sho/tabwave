import axios from "axios";
import { printInspect, createInspectCommand } from "../commands/inspect";
import { TabSession } from "../../types/session";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeSession = (overrides: Partial<TabSession> = {}): TabSession => ({
  id: "abc123",
  name: "Work",
  tabs: [
    { url: "https://github.com", title: "GitHub" },
    { url: "https://example.com", title: "Example" },
  ],
  createdAt: new Date("2024-01-01T10:00:00Z").toISOString(),
  updatedAt: new Date("2024-01-02T12:00:00Z").toISOString(),
  tags: ["dev"],
  labels: [],
  pinned: false,
  locked: false,
  archived: false,
  ...overrides,
});

describe("printInspect", () => {
  it("prints session details", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    printInspect(makeSession());
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Work"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("Tabs    : 2"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("GitHub"));
    spy.mockRestore();
  });

  it("prints note when present", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    printInspect(makeSession({ note: "important session" }));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("important session"));
    spy.mockRestore();
  });
});

describe("createInspectCommand", () => {
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
  });

  afterEach(() => {
    exitSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("prints inspect output for a valid session", async () => {
    const session = makeSession();
    mockedAxios.get.mockResolvedValueOnce({ data: session });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const cmd = createInspectCommand();
    await cmd.parseAsync(["node", "inspect", "abc123"]);
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("abc123"));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Work"));
    logSpy.mockRestore();
  });

  it("outputs JSON when --json flag is set", async () => {
    const session = makeSession();
    mockedAxios.get.mockResolvedValueOnce({ data: session });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const cmd = createInspectCommand();
    await cmd.parseAsync(["node", "inspect", "abc123", "--json"]);
    const output = logSpy.mock.calls[0][0];
    expect(JSON.parse(output)).toMatchObject({ id: "abc123" });
    logSpy.mockRestore();
  });

  it("exits with error on 404", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } });
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const cmd = createInspectCommand();
    await expect(cmd.parseAsync(["node", "inspect", "missing"])).rejects.toThrow("exit");
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
    errSpy.mockRestore();
  });
});
