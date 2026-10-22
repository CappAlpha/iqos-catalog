import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCatalog } from "../../features/api/fetchCatalog";
import type { TFeedResult } from "../../features/model/types";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  parse: vi.fn<(xml: string) => TFeedResult>(),
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("axios", () => ({
  default: { get: mocks.get, isCancel: () => false },
}));
vi.mock("@/shared/config", () => ({
  FEED_URL: "https://example.invalid/feed",
}));
vi.mock("../../features/model/constants", () => ({
  RESERVE_FEED_URL: "/reserve.xml",
}));
vi.mock("../../features/api/feedParser", () => ({
  parseXmlCatalog: mocks.parse,
}));
vi.mock("@/shared/lib/logger", () => ({ logsM: mocks.logger }));
vi.mock("@/shared/lib/customToastTemplate", () => ({
  customToastTemplate: vi.fn(),
}));
vi.mock("@/shared/lib/axiosFormatError", () => ({
  formatError: (error: unknown) => error,
}));

const feed: TFeedResult = { categories: [], products: [] };

describe("fetchCatalog source metadata", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.parse.mockReturnValue(feed);
  });

  it("marks a successful primary request with its load time", async () => {
    mocks.get.mockResolvedValue({ data: "<primary />" });
    const startedAt = Date.now();

    const result = await fetchCatalog();

    expect(result).toMatchObject({
      ...feed,
      source: "primary",
    });
    expect(result.fetchedAt).toBeGreaterThanOrEqual(startedAt);
    expect(result.fetchedAt).toBeLessThanOrEqual(Date.now());
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it("marks the bundled fallback as reserve after a primary failure", async () => {
    mocks.get.mockRejectedValueOnce(new Error("Offline"));
    mocks.get.mockResolvedValueOnce({ data: "<reserve />" });

    const result = await fetchCatalog();

    expect(result.source).toBe("reserve");
    expect(result.fetchedAt).toBeGreaterThan(0);
    expect(mocks.get).toHaveBeenNthCalledWith(
      2,
      "/reserve.xml",
      expect.any(Object),
    );
  });

  it("uses the reserve feed when the primary XML cannot be parsed", async () => {
    mocks.get.mockResolvedValue({ data: "<feed />" });
    mocks.parse.mockImplementationOnce(() => {
      throw new Error("Invalid XML");
    });

    expect((await fetchCatalog()).source).toBe("reserve");
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });

  it("does not fall back after cancellation", async () => {
    mocks.get.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(fetchCatalog()).rejects.toMatchObject({ name: "AbortError" });
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });

  it("rejects if neither source can be loaded", async () => {
    mocks.get.mockRejectedValue(new Error("Offline"));

    await expect(fetchCatalog()).rejects.toThrow("Offline");
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
});
