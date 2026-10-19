import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAppLogger } from "@/shared/lib/logger";

import {
  UNSUPPORTED_MESSAGE,
  USB_CONFIG,
} from "../../features/model/constants";
import type {
  IUsbConnectionResult,
  IUsbDeviceConfig,
  IUsbStrategy,
} from "../../features/model/types";
import { UsbM } from "../../features/model/usbM";

const platformState = vi.hoisted(() => ({
  IS_ANDROID: false,
  IS_CAPACITOR: false,
  IS_NATIVE_USB_AVAILABLE: false,
  IS_WEB_USB_SUPPORTED: true,
}));

const PLATFORM_DEFAULTS = { ...platformState };

vi.mock("@/shared/config/platform", () => platformState);

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

const loggerMocks = {
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const logger: IAppLogger = loggerMocks;

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
  beforeEach(() => {
    Object.assign(platformState, PLATFORM_DEFAULTS);
  });

  it("keeps state clean when the web API is unsupported", async () => {
    platformState.IS_WEB_USB_SUPPORTED = false;
    const strategy = createStrategy();
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();

    expect(strategy.connect).not.toHaveBeenCalled();
    expect(usb.status).toBe("disconnected");
    expect(usb.error).toBeNull();
    expect(loggerMocks.warn).toHaveBeenCalledWith(
      `[USB_M] ${UNSUPPORTED_MESSAGE}`,
    );
  });

  it("keeps state clean when the native API is unsupported", async () => {
    platformState.IS_WEB_USB_SUPPORTED = true;
    platformState.IS_CAPACITOR = true;
    platformState.IS_ANDROID = true;
    platformState.IS_NATIVE_USB_AVAILABLE = false;
    const strategy = createStrategy();
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();

    expect(strategy.connect).not.toHaveBeenCalled();
    expect(usb.status).toBe("disconnected");
    expect(usb.error).toBeNull();
    expect(loggerMocks.warn).toHaveBeenCalledWith(
      `[USB_M] ${UNSUPPORTED_MESSAGE}`,
    );
  });

  it("connects when the native API is supported", async () => {
    platformState.IS_WEB_USB_SUPPORTED = false;
    platformState.IS_CAPACITOR = true;
    platformState.IS_ANDROID = true;
    platformState.IS_NATIVE_USB_AVAILABLE = true;
    const strategy = createStrategy();
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();

    expect(strategy.connect).toHaveBeenCalledWith(
      USB_CONFIG,
      expect.any(Function),
    );
    expect(usb.isConnected).toBe(true);
  });

  it("connects through the injected strategy and refreshes battery", async () => {
    const strategy = createStrategy();
    const usb = new UsbM(() => Promise.resolve(strategy), logger);

    await usb.connect();
    await usb.refreshBattery();

    expect(strategy.connect).toHaveBeenCalledWith(
      USB_CONFIG,
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
