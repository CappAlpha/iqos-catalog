import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TDeviceSupport } from "@/shared/config/types";
import type { IAppLogger } from "@/shared/lib/logger";

import { BluetoothM } from "../../features/model/bluetoothM";
import { UNSUPPORTED_MESSAGE } from "../../features/model/constants";
import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
  IBluetoothStrategy,
} from "../../features/model/types";

const platformState = vi.hoisted((): { BLUETOOTH_SUPPORT: TDeviceSupport } => ({
  BLUETOOTH_SUPPORT: {
    transport: "web",
    unavailableReason: null,
  },
}));

vi.mock("@/shared/config/platform", () => platformState);

const CONNECTION_RESULT: IBluetoothConnectionResult = {
  device: { id: "device-id", name: "IQOS" },
  batteryLevel: 81,
  deviceInfo: {
    manufacturerName: "Manufacturer",
    modelNumber: "Model",
    serialNumber: "Serial",
    hardwareRevision: "Hardware",
    firmwareRevision: "Firmware",
    softwareRevision: "Software",
  },
};

const loggerMocks = {
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const logger: IAppLogger = loggerMocks;

const createStrategy = (result = CONNECTION_RESULT) =>
  ({
    connect: vi.fn(
      (config: IBluetoothDeviceConfig, onDisconnect: () => void) => {
        void config;
        void onDisconnect;
        return Promise.resolve(result);
      },
    ),
    disconnect: vi.fn(() => Promise.resolve()),
    getBatteryLevel: vi.fn(() => Promise.resolve(79)),
  }) satisfies IBluetoothStrategy;

describe("BluetoothM", () => {
  beforeEach(() => {
    platformState.BLUETOOTH_SUPPORT = {
      transport: "web",
      unavailableReason: null,
    };
  });

  it("keeps state clean when the API is unsupported", async () => {
    platformState.BLUETOOTH_SUPPORT = {
      transport: null,
      unavailableReason: "web-api-unavailable",
    };
    const strategy = createStrategy();
    const bluetooth = new BluetoothM(() => Promise.resolve(strategy), logger);

    await bluetooth.connect();

    expect(strategy.connect).not.toHaveBeenCalled();
    expect(bluetooth.status).toBe("disconnected");
    expect(bluetooth.error).toBeNull();
    expect(bluetooth.device).toBeNull();
    expect(loggerMocks.warn).toHaveBeenCalledWith(
      `[BLE_M] ${UNSUPPORTED_MESSAGE}`,
    );
  });

  it("connects through the injected strategy and refreshes battery", async () => {
    const strategy = createStrategy();
    const bluetooth = new BluetoothM(() => Promise.resolve(strategy), logger);

    await bluetooth.connect();
    await bluetooth.refreshBattery();

    expect(strategy.connect).toHaveBeenCalledTimes(1);
    expect(bluetooth.isConnected).toBe(true);
    expect(bluetooth.device).toEqual(CONNECTION_RESULT.device);
    expect(bluetooth.deviceInfo).toEqual(CONNECTION_RESULT.deviceInfo);
    expect(bluetooth.batteryLevel).toBe(79);
    expect(bluetooth.isRefreshingBattery).toBe(false);
  });

  it("does not allow a second connection while connecting", async () => {
    let resolveStrategy: ((strategy: IBluetoothStrategy) => void) | undefined;
    const strategy = createStrategy();
    const getStrategy = vi.fn(
      () =>
        new Promise<IBluetoothStrategy>((resolve) => {
          resolveStrategy = resolve;
        }),
    );
    const bluetooth = new BluetoothM(getStrategy, logger);

    const firstConnect = bluetooth.connect();
    await Promise.resolve();
    await bluetooth.connect();
    resolveStrategy?.(strategy);
    await firstConnect;

    expect(getStrategy).toHaveBeenCalledTimes(1);
    expect(strategy.connect).toHaveBeenCalledTimes(1);
  });

  it("resets state and cleans up when connection fails", async () => {
    const strategy = createStrategy();
    strategy.connect.mockRejectedValueOnce(new Error("Access denied"));
    const bluetooth = new BluetoothM(() => Promise.resolve(strategy), logger);

    await bluetooth.connect();

    expect(bluetooth.status).toBe("disconnected");
    expect(bluetooth.device).toBeNull();
    expect(bluetooth.error).toBe("Access denied");
    expect(bluetooth.batteryLevel).toBeNull();
    expect(strategy.disconnect).toHaveBeenCalledTimes(1);
  });

  it("cancels a connection through cancelIfConnecting", async () => {
    let resolveStrategy: ((strategy: IBluetoothStrategy) => void) | undefined;
    const strategy = createStrategy();
    const getStrategy = () =>
      new Promise<IBluetoothStrategy>((resolve) => {
        resolveStrategy = resolve;
      });
    const bluetooth = new BluetoothM(getStrategy, logger);

    const connectPromise = bluetooth.connect();
    await Promise.resolve();
    bluetooth.cancelIfConnecting();
    resolveStrategy?.(strategy);
    await connectPromise;

    expect(strategy.connect).not.toHaveBeenCalled();
    expect(bluetooth.status).toBe("disconnected");
    expect(bluetooth.error).toBeNull();
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
    const bluetooth = new BluetoothM(() => Promise.resolve(strategy), logger);

    await bluetooth.connect();
    const refreshPromise = bluetooth.refreshBattery();
    await bluetooth.disconnect();
    resolveBattery?.(12);
    await refreshPromise;

    expect(bluetooth.isConnected).toBe(false);
    expect(bluetooth.batteryLevel).toBeNull();
    expect(bluetooth.error).toBeNull();
  });

  it("reports a battery refresh error without disconnecting", async () => {
    const strategy = createStrategy();
    strategy.getBatteryLevel.mockRejectedValueOnce(new Error("Read failed"));
    const bluetooth = new BluetoothM(() => Promise.resolve(strategy), logger);

    await bluetooth.connect();
    await bluetooth.refreshBattery();

    expect(bluetooth.isConnected).toBe(true);
    expect(bluetooth.batteryLevel).toBe(81);
    expect(bluetooth.error).toBe("Read failed");
    expect(bluetooth.isRefreshingBattery).toBe(false);
  });

  it("resets state on a system disconnect callback", async () => {
    const strategy = createStrategy();
    const bluetooth = new BluetoothM(() => Promise.resolve(strategy), logger);

    await bluetooth.connect();
    const onDisconnect = strategy.connect.mock.calls[0]?.[1] as
      (() => void) | undefined;
    onDisconnect?.();

    expect(bluetooth.status).toBe("disconnected");
    expect(bluetooth.error).toContain("Соединение разорвано");
    expect(bluetooth.device).toBeNull();
    expect(bluetooth.batteryLevel).toBeNull();
  });

  it("does not cancel a newer connection when a stale attempt settles later", async () => {
    let resolveFirst:
      ((result: IBluetoothConnectionResult) => void) | undefined;
    let resolveSecond:
      ((result: IBluetoothConnectionResult) => void) | undefined;
    const firstStrategy = createStrategy();
    firstStrategy.connect.mockImplementationOnce(
      () =>
        new Promise<IBluetoothConnectionResult>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const secondStrategy = createStrategy();
    secondStrategy.connect.mockImplementationOnce(
      (
        _config: IBluetoothDeviceConfig,
        _onDisconnect: () => void,
        signal?: AbortSignal,
      ) =>
        new Promise<IBluetoothConnectionResult>((resolve, reject) => {
          signal?.addEventListener("abort", () =>
            reject(new DOMException("Подключение отменено.", "AbortError")),
          );
          void _config;
          void _onDisconnect;
          resolveSecond = resolve;
        }),
    );

    const getStrategy = vi
      .fn()
      .mockResolvedValueOnce(firstStrategy)
      .mockResolvedValueOnce(secondStrategy);
    const bluetooth = new BluetoothM(getStrategy, logger);

    const firstConnect = bluetooth.connect();
    await Promise.resolve();
    expect(firstStrategy.connect).toHaveBeenCalledTimes(1);
    await bluetooth.disconnect();

    const secondConnect = bluetooth.connect();
    await Promise.resolve();
    expect(secondStrategy.connect).toHaveBeenCalledTimes(1);

    resolveFirst?.(CONNECTION_RESULT);
    await firstConnect;

    resolveSecond?.(CONNECTION_RESULT);
    await secondConnect;

    expect(bluetooth.isConnected).toBe(true);
    expect(bluetooth.device).toEqual(CONNECTION_RESULT.device);
    expect(secondStrategy.disconnect).not.toHaveBeenCalled();
  });
});
