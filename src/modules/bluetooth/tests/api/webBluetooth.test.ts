import { beforeEach, describe, expect, it, vi } from "vitest";

import { WebBluetooth } from "../../features/api/webBluetooth";
import { BATTERY } from "../../features/model/constants";

const createTextValue = (value: string): DataView =>
  new DataView(new TextEncoder().encode(value).buffer);

describe("WebBluetooth", () => {
  const removeEventListener = vi.fn();
  const addEventListener = vi.fn();
  const disconnect = vi.fn();
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

    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        bluetooth: {
          requestDevice: vi.fn(() => Promise.resolve(device)),
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
});
