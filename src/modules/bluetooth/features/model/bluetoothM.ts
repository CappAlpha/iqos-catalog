import { makeAutoObservable, observable, runInAction } from "mobx";

import {
  IS_CAPACITOR,
  IS_NATIVE_BLUETOOTH_AVAILABLE,
  IS_WEB_SUPPORTED,
} from "@/shared/config/platform";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { getBluetoothStrategy } from "../lib/getBluetoothStrategy";
import { SERVICE_UUIDS } from "./constants";
import type {
  IBluetoothDeviceConfig,
  IBluetoothStrategy,
  IBluetoothConnectionResult,
} from "./types";

type BluetoothStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";

class BluetoothM {
  device: Partial<BluetoothDevice> | null = null;
  status: BluetoothStatus = "disconnected";
  error: string | null = null;
  services: string[] = [];
  batteryLevel: number | null = null;
  readonly deviceConfig: IBluetoothDeviceConfig = {
    services: Object.values(SERVICE_UUIDS),
  };

  readonly #getStrategy: () => Promise<IBluetoothStrategy>;

  #strategy: IBluetoothStrategy | null = null;
  #currentConnectionId = 0;

  constructor(getStrategy: () => Promise<IBluetoothStrategy>) {
    this.#getStrategy = getStrategy;
    makeAutoObservable(this, {
      device: observable.ref,
      deviceConfig: false,
    });
  }

  get isConnected() {
    return this.status === "connected";
  }
  get isConnecting() {
    return this.status === "connecting";
  }
  get isDisconnecting() {
    return this.status === "disconnecting";
  }

  get isSupported() {
    return IS_CAPACITOR ? IS_NATIVE_BLUETOOTH_AVAILABLE : IS_WEB_SUPPORTED;
  }

  private readonly setConnected = ({
    device,
    services,
    batteryLevel,
  }: IBluetoothConnectionResult) => {
    this.status = "connected";
    this.error = null;
    this.device = device;
    this.services = services;
    this.batteryLevel = batteryLevel;
  };

  private readonly reset = (error: string | null = null) => {
    this.device = null;
    this.status = "disconnected";
    this.error = error;
    this.services = [];
    this.batteryLevel = null;
  };

  connect = async () => {
    if (this.isConnecting || this.isDisconnecting) return;

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    runInAction(() => {
      this.status = "connecting";
      this.error = null;
      this.batteryLevel = null;
      this.services = [];
    });

    try {
      this.#strategy ??= await this.#getStrategy();

      const result = await actionPromiseWithTimeout(
        this.#strategy.connect(this.deviceConfig, this.handleDisconnect),
        20000,
        "Подключения по Bluetooth не удалось, попробуйте ещё раз.",
      );

      if (connectionId !== this.#currentConnectionId) {
        await this.#strategy.disconnect().catch(() => {});
        return;
      }

      this.setConnected(result);
    } catch (err) {
      if (connectionId !== this.#currentConnectionId) return;

      await this.#strategy?.disconnect().catch(() => {});

      const errMsg = getErrorMessage(err, "Ошибка подключения по Bluetooth.");
      this.reset(errMsg);
    }
  };

  private readonly handleDisconnect = () => {
    this.#currentConnectionId++;

    if (this.isDisconnecting) {
      this.reset();
    } else {
      this.reset(
        "Соединение разорвано: устройство отключено или вышло из зоны действия.",
      );
    }
  };

  disconnect = async () => {
    if (this.isDisconnecting || (!this.isConnected && !this.isConnecting))
      return;

    const wasConnecting = this.isConnecting;

    runInAction(() => {
      this.status = "disconnecting";
      this.error = null;
    });

    this.#currentConnectionId++;

    try {
      await actionPromiseWithTimeout(
        this.#strategy?.disconnect() ?? Promise.resolve(),
        3000,
        "Таймаут физического отключения",
      );
    } catch (err) {
      console.warn(
        "Физическое отключение не завершилось штатно (возможно, стек Bluetooth завис):",
        err,
      );
    } finally {
      this.reset(wasConnecting ? "Подключение отменено." : null);
    }
  };

  refreshBattery = async () => {
    if (!this.isConnected) return;

    try {
      const battery = await this.#strategy?.getBatteryLevel();

      if (!this.isConnected) return;

      runInAction(() => {
        this.batteryLevel = battery ?? null;
      });
    } catch (err) {
      if (!this.isConnected) return;

      runInAction(() => {
        this.error = getErrorMessage(err, "Не удалось обновить заряд батареи.");
      });
    }
  };

  cancelIfConnecting = () => {
    if (this.isConnecting) {
      void this.disconnect();
    }
  };
}

export const bluetoothM = new BluetoothM(getBluetoothStrategy);
