import { describe, expect, it, vi } from "vitest";

import { createCharReader } from "../../features/lib/readCharacteristic";

const valueOf = (value: string): DataView =>
  new DataView(new TextEncoder().encode(value).buffer);

describe("createCharReader", () => {
  it("decodes a non-empty characteristic as UTF-8", async () => {
    const readRaw = vi.fn(() => Promise.resolve(valueOf("  Device name  ")));
    const read = createCharReader(readRaw);

    await expect(read("service", "characteristic")).resolves.toBe(
      "  Device name  ",
    );
    expect(readRaw).toHaveBeenCalledWith("service", "characteristic");
  });

  it("returns null for an empty characteristic", async () => {
    const read = createCharReader(() =>
      Promise.resolve(new DataView(new ArrayBuffer(0))),
    );

    await expect(read("service", "characteristic")).resolves.toBeNull();
  });

  it("returns null when the raw characteristic read fails", async () => {
    const read = createCharReader(() =>
      Promise.reject(new Error("Read failed")),
    );

    await expect(read("service", "characteristic")).resolves.toBeNull();
  });
});
