import { describe, expect, it, vi } from "vitest";

import { BaseConnectionStrategy } from "@/shared/lib/baseConnectionStrategy";
import { logsM } from "@/shared/lib/logger";

import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../../features/model/types";

const CONNECTION_RESULT: IBluetoothConnectionResult = {
  device: { id: "device-id", name: "Device" },
  batteryLevel: null,
  deviceInfo: {
    manufacturerName: null,
    modelNumber: null,
    serialNumber: null,
    hardwareRevision: null,
    firmwareRevision: null,
    softwareRevision: null,
  },
};

class TestBluetoothStrategy extends BaseConnectionStrategy<
  IBluetoothDeviceConfig,
  IBluetoothConnectionResult
> {
  protected readonly logPrefix = "[TestBluetooth]";
  protected readonly disconnectErrorMessage = "Ошибка тестового отключения";
  protected readonly manualDisconnectMessage = "Тестовое отключение.";
  readonly disconnectPhysical = vi.fn(() => Promise.resolve());

  constructor() {
    super(logsM);
  }

  async connect(
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IBluetoothConnectionResult> {
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

describe("BaseConnectionStrategy (Bluetooth)", () => {
  it("does not notify the store on a manual disconnect", async () => {
    const strategy = new TestBluetoothStrategy();
    const onDisconnect = vi.fn();

    await strategy.connect({ services: [] }, onDisconnect);
    await strategy.disconnect();

    expect(onDisconnect).not.toHaveBeenCalled();
    expect(strategy.disconnectPhysical).toHaveBeenCalledTimes(1);
  });

  it("notifies the store on a system disconnect", async () => {
    const strategy = new TestBluetoothStrategy();
    const onDisconnect = vi.fn();

    await strategy.connect({ services: [] }, onDisconnect);
    strategy.notifySystemDisconnect();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(strategy.disconnectPhysical).toHaveBeenCalledTimes(1);
  });

  it("does not run physical cleanup twice for one connection", async () => {
    const strategy = new TestBluetoothStrategy();

    await strategy.connect({ services: [] }, vi.fn());
    await strategy.disconnect();
    await strategy.disconnect();

    expect(strategy.disconnectPhysical).toHaveBeenCalledTimes(1);
  });

  it("waits for physical cleanup to finish", async () => {
    let resolveDisconnect: (() => void) | undefined;
    const strategy = new TestBluetoothStrategy();
    strategy.disconnectPhysical.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDisconnect = resolve;
        }),
    );

    await strategy.connect({ services: [] }, vi.fn());
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
