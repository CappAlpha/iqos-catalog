import { describe, expect, it, vi } from "vitest";

import type { IAppLogger } from "@/shared/lib/logger";

import type {
  IUsbConnectionResult,
  IUsbDeviceConfig,
  IUsbStrategy,
} from "../../features/model/types";
import { UsbM } from "../../features/model/usbM";

vi.mock("@/shared/config/platform", () => ({
  IS_ANDROID: false,
  IS_CAPACITOR: false,
  IS_NATIVE_USB_AVAILABLE: false,
  IS_WEB_USB_SUPPORTED: true,
}));

const CONNECTION_RESULT: IUsbConnectionResult = {
  device: {
    manufacturerName: "Manufacturer",
    productName: "USB device",
    vendorId: 10073,
    productId: 3,
  },
  batteryAvailable: true,
  batteryLevel: 81,
};

const logger: IAppLogger = {
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const createStrategy = (result = CONNECTION_RESULT) => ({
  connect: vi.fn((config: IUsbDeviceConfig, onDisconnect: () => void) => {
    void config;
    void onDisconnect;
    return Promise.resolve(result);
  }),
  disconnect: vi.fn(() => Promise.resolve()),
  getBatteryLevel: vi.fn(() => Promise.resolve(79)),
});

describe("UsbM", () => {
  it("connects through the injected strategy and refreshes battery", async () => {
    const strategy = createStrategy();
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();
    await usb.refreshBattery();

    expect(strategy.connect).toHaveBeenCalledWith(
      usb.deviceConfig,
      expect.any(Function),
    );
    expect(usb.isConnected).toBe(true);
    expect(usb.device?.productName).toBe("USB device");
    expect(usb.batteryAvailable).toBe(true);
    expect(usb.batteryLevel).toBe(79);
    expect(usb.isRefreshingBattery).toBe(false);
  });

  it("does not allow a second connection while connecting", async () => {
    let resolveStrategy: ((strategy: IUsbStrategy) => void) | undefined;
    const strategy = createStrategy();
    const getStrategy = vi.fn(
      () =>
        new Promise<IUsbStrategy>((resolve) => {
          resolveStrategy = resolve;
        }),
    );
    const usb = new UsbM(getStrategy, logger);

    const firstConnect = usb.connect();
    await Promise.resolve();
    await usb.connect();
    resolveStrategy?.(strategy);
    await firstConnect;

    expect(getStrategy).toHaveBeenCalledTimes(1);
    expect(strategy.connect).toHaveBeenCalledTimes(1);
  });

  it("resets state and calls strategy cleanup when connect fails", async () => {
    const strategy = createStrategy();
    strategy.connect.mockRejectedValueOnce(new Error("Access denied"));
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();

    expect(usb.status).toBe("disconnected");
    expect(usb.device).toBeNull();
    expect(usb.error).toBe("Access denied");
    expect(usb.batteryAvailable).toBe(false);
    expect(strategy.disconnect).toHaveBeenCalledTimes(1);
  });

  it("ignores a battery result that completes after disconnect", async () => {
    let resolveBattery: ((level: number) => void) | undefined;
    const strategy = createStrategy();
    strategy.getBatteryLevel.mockImplementation(
      () =>
        new Promise<number>((resolve) => {
          resolveBattery = resolve;
        }),
    );
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();
    const refreshPromise = usb.refreshBattery();
    await usb.disconnect();
    resolveBattery?.(12);
    await refreshPromise;

    expect(usb.isConnected).toBe(false);
    expect(usb.batteryLevel).toBeNull();
    expect(usb.error).toBeNull();
  });

  it("reports a battery refresh error without disconnecting", async () => {
    const strategy = createStrategy();
    strategy.getBatteryLevel.mockRejectedValueOnce(
      new Error("Transfer failed"),
    );
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();
    await usb.refreshBattery();

    expect(usb.isConnected).toBe(true);
    expect(usb.batteryAvailable).toBe(true);
    expect(usb.batteryLevel).toBe(81);
    expect(usb.error).toBe("Transfer failed");
    expect(usb.isRefreshingBattery).toBe(false);
  });

  it("resets state on a system disconnect callback", async () => {
    const strategy = createStrategy();
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();
    const onDisconnect = strategy.connect.mock.calls[0]?.[1];
    onDisconnect();

    expect(usb.status).toBe("disconnected");
    expect(usb.error).toContain("Соединение разорвано");
    expect(usb.batteryAvailable).toBe(false);
  });
});
