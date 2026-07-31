import { beforeEach, describe, expect, it, vi } from "vitest";

import { NativeBluetooth } from "../../features/api/nativeBluetooth";

const { bleClient } = vi.hoisted(() => ({
  bleClient: {
    isEnabled: vi.fn(),
    requestDevice: vi.fn(),
    connect: vi.fn(),
    read: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock("@capacitor-community/bluetooth-le", () => ({
  BleClient: bleClient,
}));

describe("NativeBluetooth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no device is connected", async () => {
    const strategy = new NativeBluetooth();

    await expect(strategy.getBatteryLevel()).resolves.toBeNull();
    expect(bleClient.read).not.toHaveBeenCalled();
  });

  it("reads the first byte as the battery percentage", async () => {
    const strategy = new NativeBluetooth();
    (strategy as unknown as { deviceId: string }).deviceId = "device-id";
    bleClient.read.mockResolvedValueOnce(
      new DataView(Uint8Array.from([73]).buffer),
    );

    await expect(strategy.getBatteryLevel()).resolves.toBe(73);
    expect(bleClient.read).toHaveBeenCalledWith(
      "device-id",
      "0000180f-0000-1000-8000-00805f9b34fb",
      "00002a19-0000-1000-8000-00805f9b34fb",
    );
  });

  it("returns null for an empty battery characteristic", async () => {
    const strategy = new NativeBluetooth();
    (strategy as unknown as { deviceId: string }).deviceId = "device-id";
    bleClient.read.mockResolvedValueOnce(new DataView(new ArrayBuffer(0)));

    await expect(strategy.getBatteryLevel()).resolves.toBeNull();
  });
});
