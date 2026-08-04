import { describe, expect, it, vi } from "vitest";

import { logsM } from "@/modules/logs/features/model/logsM";
import { BaseConnectionStrategy } from "@/shared/lib/baseConnectionStrategy";

import type {
  IUsbConnectionResult,
  IUsbDeviceConfig,
} from "../../features/model/types";

const CONNECTION_RESULT: IUsbConnectionResult = {
  device: {
    manufacturerName: "Manufacturer",
    productName: "USB device",
    vendorId: 10073,
    productId: 3,
  },
  batteryAvailable: false,
  batteryLevel: null,
};

class TestUsbStrategy extends BaseConnectionStrategy<
  IUsbDeviceConfig,
  IUsbConnectionResult
> {
  protected readonly logPrefix = "[TestUSB]";
  protected readonly disconnectErrorMessage = "Ошибка тестового отключения";
  protected readonly manualDisconnectMessage = "Тестовое отключение.";
  readonly disconnectPhysical = vi.fn(() => Promise.resolve());

  constructor() {
    super(logsM);
  }

  connect(
    config: IUsbDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IUsbConnectionResult> {
    return this.withDisconnectCallback(onDisconnect, () => {
      void config;
      return Promise.resolve(CONNECTION_RESULT);
    });
  }

  getBatteryLevel(): Promise<number | null> {
    return Promise.resolve(null);
  }

  protected doDisconnect = this.disconnectPhysical;

  notifySystemDisconnect(): void {
    this.notifyDisconnected();
  }
}

describe("BaseConnectionStrategy (USB)", () => {
  it("does not notify on manual disconnect", async () => {
    const strategy = new TestUsbStrategy();
    const onDisconnect = vi.fn();

    await strategy.connect({ vendorId: 10073, productId: 3 }, onDisconnect);
    await strategy.disconnect();

    expect(onDisconnect).not.toHaveBeenCalled();
    expect(strategy.disconnectPhysical).toHaveBeenCalledTimes(1);
  });

  it("notifies after a system disconnect cleanup", async () => {
    const strategy = new TestUsbStrategy();
    const onDisconnect = vi.fn();

    await strategy.connect({ vendorId: 10073, productId: 3 }, onDisconnect);
    strategy.notifySystemDisconnect();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(strategy.disconnectPhysical).toHaveBeenCalledTimes(1);
  });

  it("waits for physical cleanup", async () => {
    let resolveDisconnect: (() => void) | undefined;
    const strategy = new TestUsbStrategy();
    strategy.disconnectPhysical.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDisconnect = resolve;
        }),
    );

    await strategy.connect({ vendorId: 10073, productId: 3 }, vi.fn());
    const disconnectPromise = strategy.disconnect();
    let isResolved = false;
    void disconnectPromise.then(() => {
      isResolved = true;
    });

    await Promise.resolve();
    expect(isResolved).toBe(false);

    resolveDisconnect?.();
    await disconnectPromise;
    expect(isResolved).toBe(true);
  });
});
