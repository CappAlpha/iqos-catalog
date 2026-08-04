import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebBluetooth } from "../../features/api/webBluetooth";
import { BATTERY, REQUIRED_SERVICES } from "../../features/model/constants";

const createTextValue = (value: string): DataView =>
  new DataView(new TextEncoder().encode(value).buffer);

describe("WebBluetooth", () => {
  const removeEventListener = vi.fn();
  const addEventListener = vi.fn();
  const disconnect = vi.fn();
  let requestDevice: ReturnType<typeof vi.fn>;
  const gatt = {
    connected: true,
    connect: vi.fn(() => Promise.resolve()),
    disconnect,
    getPrimaryService: vi.fn(() =>
      Promise.resolve({
        getCharacteristic: vi.fn((characteristic: string) =>
          Promise.resolve({
            readValue: vi.fn(() =>
              Promise.resolve(
                characteristic === BATTERY.LEVEL
                  ? new DataView(Uint8Array.from([73]).buffer)
                  : createTextValue("value"),
              ),
            ),
          }),
        ),
      }),
    ),
  };
  const device = {
    id: "web-device-id",
    name: "Web Device",
    gatt,
    addEventListener,
    removeEventListener,
  } as unknown as BluetoothDevice;

  beforeEach(() => {
    vi.clearAllMocks();
    gatt.connected = true;

    requestDevice = vi.fn(() => Promise.resolve(device));
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        bluetooth: {
          requestDevice,
        },
      },
    });
  });

  it("selects, connects and reads initial metadata", async () => {
    const strategy = new WebBluetooth();

    const result = await strategy.connect({ services: [] }, vi.fn());

    expect(result.device).toEqual({
      id: "web-device-id",
      name: "value",
    });
    expect(result.batteryLevel).toBe(73);
    expect(gatt.connect).toHaveBeenCalledTimes(1);
    expect(requestDevice).toHaveBeenCalledWith({
      acceptAllDevices: true,
      optionalServices: [...REQUIRED_SERVICES],
    });
    expect(addEventListener).toHaveBeenCalledWith(
      "gattserverdisconnected",
      expect.any(Function),
    );
  });

  it("removes listeners and disconnects the GATT server", async () => {
    const strategy = new WebBluetooth();

    await strategy.connect({ services: [] }, vi.fn());
    await strategy.disconnect();

    expect(removeEventListener).toHaveBeenCalledWith(
      "gattserverdisconnected",
      expect.any(Function),
    );
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("returns base information when the selected device has no GATT", async () => {
    const strategy = new WebBluetooth();
    const deviceWithoutGatt = {
      ...device,
      gatt: null,
    } as unknown as BluetoothDevice;
    requestDevice.mockResolvedValueOnce(deviceWithoutGatt);

    await expect(strategy.connect({ services: [] }, vi.fn())).resolves.toEqual({
      device: { id: "web-device-id", name: "Web Device" },
      deviceInfo: {
        manufacturerName: null,
        modelNumber: null,
        serialNumber: null,
        hardwareRevision: null,
        firmwareRevision: null,
        softwareRevision: null,
      },
      batteryLevel: null,
    });
    expect(gatt.connect).not.toHaveBeenCalled();
  });

  it("returns null when GATT is disconnected while reading battery", async () => {
    const strategy = new WebBluetooth();
    gatt.connected = false;

    await expect(strategy.getBatteryLevel()).resolves.toBeNull();
    expect(gatt.getPrimaryService).not.toHaveBeenCalled();
  });

  it("cleans up and rethrows when GATT connection fails", async () => {
    const strategy = new WebBluetooth();
    const connectError = new Error("GATT unavailable");
    gatt.connect.mockRejectedValueOnce(connectError);

    await expect(strategy.connect({ services: [] }, vi.fn())).rejects.toBe(
      connectError,
    );
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("notifies the callback after a system GATT disconnect", async () => {
    const strategy = new WebBluetooth();
    const onDisconnect = vi.fn();

    await strategy.connect({ services: [] }, onDisconnect);
    const listener = addEventListener.mock.calls[0]?.[1] as
      (() => void) | undefined;
    listener?.();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(removeEventListener).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
