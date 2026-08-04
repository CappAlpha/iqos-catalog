import { beforeEach, describe, expect, it, vi } from "vitest";

import { NativeBluetooth } from "../../features/api/nativeBluetooth";
import {
  DEVICE_CONFIG,
  REQUIRED_SERVICES,
} from "../../features/model/constants";

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

  it("requests a device with the optional services used by the test flow", async () => {
    const strategy = new NativeBluetooth();
    bleClient.isEnabled.mockResolvedValueOnce(true);
    bleClient.requestDevice.mockResolvedValueOnce({
      deviceId: "device-id",
      name: "IQOS",
    });
    bleClient.connect.mockResolvedValueOnce(undefined);
    bleClient.read.mockRejectedValue(new Error("Characteristic unavailable"));

    await strategy.connect(DEVICE_CONFIG, vi.fn());

    expect(bleClient.requestDevice).toHaveBeenCalledWith({
      optionalServices: [...REQUIRED_SERVICES],
    });
  });

  it("rethrows chooser errors without attempting a native disconnect", async () => {
    const strategy = new NativeBluetooth();
    const chooserError = new Error("User cancelled chooser");
    bleClient.isEnabled.mockResolvedValueOnce(true);
    bleClient.requestDevice.mockRejectedValueOnce(chooserError);

    await expect(strategy.connect(DEVICE_CONFIG, vi.fn())).rejects.toBe(
      chooserError,
    );
    expect(bleClient.connect).not.toHaveBeenCalled();
    expect(bleClient.disconnect).not.toHaveBeenCalled();
  });

  it("keeps the connection when optional metadata reads fail", async () => {
    const strategy = new NativeBluetooth();
    const readError = new Error("Native read failed");
    bleClient.isEnabled.mockResolvedValueOnce(true);
    bleClient.requestDevice.mockResolvedValueOnce({
      deviceId: "device-id",
      name: "IQOS",
    });
    bleClient.connect.mockResolvedValueOnce(undefined);
    bleClient.read.mockRejectedValue(readError);

    await expect(
      strategy.connect(DEVICE_CONFIG, vi.fn()),
    ).resolves.toMatchObject({
      device: { id: "device-id", name: "IQOS" },
      batteryLevel: null,
    });
    expect(bleClient.disconnect).not.toHaveBeenCalled();
  });

  it("forwards a native disconnect event to the owner", async () => {
    const strategy = new NativeBluetooth();
    const onDisconnect = vi.fn();
    let pluginDisconnect: (() => void) | undefined;
    bleClient.isEnabled.mockResolvedValueOnce(true);
    bleClient.requestDevice.mockResolvedValueOnce({
      deviceId: "device-id",
      name: "IQOS",
    });
    bleClient.connect.mockImplementationOnce(
      (_deviceId: string, callback: () => void) => {
        pluginDisconnect = callback;
        return Promise.resolve();
      },
    );
    bleClient.read.mockRejectedValue(new Error("Characteristic unavailable"));

    await strategy.connect(DEVICE_CONFIG, onDisconnect);
    pluginDisconnect?.();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(bleClient.disconnect).toHaveBeenCalledWith("device-id");
  });
});
