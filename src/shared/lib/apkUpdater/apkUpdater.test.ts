import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getInfo: vi.fn(),
  readdir: vi.fn(),
  deleteFile: vi.fn(),
  fetch: vi.fn<typeof fetch>(),
  toast: vi.fn(),
}));

vi.mock("@capacitor/app", () => ({ App: { getInfo: mocks.getInfo } }));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { readdir: mocks.readdir, deleteFile: mocks.deleteFile },
  Directory: { Cache: "CACHE" },
}));
vi.mock("@capacitor/file-transfer", () => ({ FileTransfer: {} }));
vi.mock("@capawesome-team/capacitor-file-opener", () => ({ FileOpener: {} }));
vi.mock("@/shared/config", () => ({
  GITHUB_RELEASES_API: "https://example.invalid/releases/latest",
}));
vi.mock("@/shared/lib/customToastTemplate", () => ({
  customToastTemplate: mocks.toast,
}));

describe("APK update check", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getInfo.mockResolvedValue({ version: "1.0.0" });
    mocks.readdir.mockResolvedValue({ files: [] });
    mocks.deleteFile.mockResolvedValue(undefined);
    mocks.fetch.mockResolvedValue(
      Response.json({
        tag_name: "v1.1.0",
        assets: [
          {
            name: "app.apk",
            browser_download_url: "https://example.invalid/app.apk",
          },
        ],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("runs once even when startup requests the check twice", async () => {
    const { checkApkUpdate } = await import("./apkUpdater");
    const firstCheck = checkApkUpdate();
    const secondCheck = checkApkUpdate();

    expect(firstCheck).toBe(secondCheck);
    await Promise.all([firstCheck, secondCheck]);

    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledTimes(1);
  });

  it("limits the release request with a timeout signal", async () => {
    const controller = new AbortController();
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(controller.signal);
    mocks.fetch.mockImplementation(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => {
              reject(new DOMException("Timed out", "TimeoutError"));
            },
            { once: true },
          );
        }),
    );
    const { checkApkUpdate } = await import("./apkUpdater");
    const check = checkApkUpdate();
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    controller.abort();

    await expect(check).resolves.toBeUndefined();
    expect(timeout).toHaveBeenCalledWith(10_000);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { tag_name: 123, assets: [] },
    { tag_name: "v1.1.0", assets: [null] },
    { tag_name: "v1.1.0", assets: [{ name: 123 }] },
  ])("ignores malformed release data: %j", async (release) => {
    mocks.fetch.mockResolvedValue(Response.json(release));
    const { checkApkUpdate } = await import("./apkUpdater");

    await expect(checkApkUpdate()).resolves.toBeUndefined();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("cleans up only APK files owned by the updater", async () => {
    mocks.readdir.mockResolvedValue({
      files: [
        { name: "update-1.0.0.apk" },
        { name: "other.apk" },
        { name: "notes.txt" },
      ],
    });
    const { checkApkUpdate } = await import("./apkUpdater");

    await checkApkUpdate();

    expect(mocks.deleteFile).toHaveBeenCalledExactlyOnceWith({
      path: "update-1.0.0.apk",
      directory: "CACHE",
    });
  });
});
