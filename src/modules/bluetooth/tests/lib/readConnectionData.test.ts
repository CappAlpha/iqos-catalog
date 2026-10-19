import { describe, expect, it, vi } from "vitest";

import { readInitialMetadata } from "../../features/lib/readConnectionData";
import { GAP } from "../../features/model/constants";

describe("readInitialMetadata", () => {
  it("uses the GAP name before the chooser fallback", async () => {
    const read = vi.fn((service: string, characteristic: string) => {
      if (service === GAP.SERVICE && characteristic === GAP.DEVICE_NAME) {
        return Promise.resolve("  Device from GAP  ");
      }

      return Promise.resolve(null);
    });

    const result = await readInitialMetadata(
      read,
      () => Promise.resolve(80),
      "Chooser name",
    );

    expect(result.deviceName).toBe("Device from GAP");
    expect(result.batteryLevel).toBe(80);
  });

  it("keeps the chooser name when GAP name is unavailable", async () => {
    const read = vi.fn(() => Promise.resolve(null));

    const result = await readInitialMetadata(
      read,
      () => Promise.resolve(null),
      "  Chooser name  ",
    );

    expect(result.deviceName).toBe("Chooser name");
    expect(result.batteryLevel).toBeNull();
  });

  it("returns null for a blank GAP name and blank fallback", async () => {
    const read = vi.fn((service: string, characteristic: string) => {
      if (service === GAP.SERVICE && characteristic === GAP.DEVICE_NAME) {
        return Promise.resolve("   ");
      }

      return Promise.resolve(null);
    });

    const result = await readInitialMetadata(
      read,
      () => Promise.resolve(null),
      "  ",
    );

    expect(result.deviceName).toBeNull();
  });

  it("keeps successful metadata when the battery read rejects", async () => {
    const read = vi.fn((service: string, characteristic: string) => {
      if (service === GAP.SERVICE && characteristic === GAP.DEVICE_NAME) {
        return Promise.resolve("Device");
      }

      return Promise.resolve(null);
    });

    const result = await readInitialMetadata(
      read,
      () => Promise.reject(new Error("Battery unavailable")),
      null,
    );

    expect(result.deviceName).toBe("Device");
    expect(result.batteryLevel).toBeNull();
  });

  it("does not fail when an individual metadata read rejects", async () => {
    const read = vi.fn((service: string, characteristic: string) => {
      if (service === GAP.SERVICE && characteristic === GAP.DEVICE_NAME) {
        return Promise.reject(new Error("GAP read failed"));
      }

      return Promise.resolve(null);
    });

    const result = await readInitialMetadata(
      read,
      () => Promise.reject(new Error("Battery read failed")),
      "Fallback",
    );

    expect(result.deviceName).toBe("Fallback");
    expect(result.deviceInfo.manufacturerName).toBeNull();
    expect(result.batteryLevel).toBeNull();
  });

  it("aborts before starting any read when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const read = vi.fn(() => Promise.resolve(null));

    await expect(
      readInitialMetadata(
        read,
        () => Promise.resolve(null),
        null,
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(read).not.toHaveBeenCalled();
  });
});
