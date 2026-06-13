import { makeAutoObservable, observable } from "mobx";

import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { getBluetoothStrategy } from "../lib/getBluetoothStrategy";
import { SERVICE_UUIDS } from "./constants";
import type {
  IBluetoothConnectionResult,
  IBluetoothStrategy,
  IBluetoothDeviceConfig,
} from "./types";

type BluetoothStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";

class BluetoothM {
  device: BluetoothDevice | null = null;
  status: BluetoothStatus = "disconnected";
  error: string | null = null;
  services: string[] = [];
  batteryLevel: number | null = null;
  deviceConfig: IBluetoothDeviceConfig = {
    services: [
      ...Object.values(SERVICE_UUIDS),
      SERVICE_UUIDS.DEVICE_CONTROL_SERVICE,
    ],
  };

  readonly #strategy: IBluetoothStrategy;
  #currentConnectionId = 0;

  constructor(getStrategy: () => IBluetoothStrategy) {
    this.#strategy = getStrategy();
    makeAutoObservable(this, {
      device: observable.ref,
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

  private readonly setConnected = ({
    services,
    batteryLevel,
    device,
  }: IBluetoothConnectionResult) => {
    this.status = "connected";
    this.error = null;
    this.services = services;
    this.batteryLevel = batteryLevel;
    this.device = device;
  };

  private readonly reset = (error: string | null = null) => {
    this.device = null;
    this.status = "disconnected";
    this.error = error;
    this.services = [];
    this.batteryLevel = null;
  };

  connect = async () => {
    if (this.status === "connecting" || this.status === "disconnecting") {
      return;
    }

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    this.status = "connecting";
    this.error = null;
    this.batteryLevel = null;
    this.services = [];

    try {
      const result = await this.#strategy.connect(
        this.deviceConfig,
        this.handleDisconnect,
      );

      if (connectionId !== this.#currentConnectionId) {
        await this.#strategy.disconnect().catch(() => {});
        return;
      }

      this.setConnected(result);
    } catch (err) {
      if (connectionId !== this.#currentConnectionId) return;

      await this.#strategy.disconnect().catch(() => {});

      const errMsg = getErrorMessage(err, "Ошибка подключения по Bluetooth");
      this.reset(errMsg);
    }
  };

  private readonly handleDisconnect = () => {
    if (this.status === "disconnecting") {
      this.reset();
    } else {
      this.reset(
        "Соединение разорвано: устройство отключено или вышло из зоны действия.",
      );
    }
  };

  refreshBattery = async () => {
    if (!this.isConnected) return;

    try {
      const battery = await this.#strategy.getBatteryLevel();

      if (!this.isConnected) return;

      this.batteryLevel = battery;
    } catch (err) {
      if (!this.isConnected) return;

      this.error = getErrorMessage(err, "Не удалось обновить заряд батареи");
    }
  };

  disconnect = async () => {
    if (this.isDisconnecting || (!this.isConnected && !this.isConnecting))
      return;

    const wasConnecting = this.isConnecting;
    this.status = "disconnecting";
    this.error = null;

    this.#currentConnectionId++;

    try {
      await actionPromiseWithTimeout(
        this.#strategy.disconnect(),
        3000,
        "Таймаут физического отключения",
      );
    } catch (err) {
      console.warn(
        "Физическое отключение не завершилось штатно (возможно, стек Bluetooth завис):",
        err,
      );
    } finally {
      this.reset(wasConnecting ? "Подключение отменено" : null);
    }
  };

  cancelIfConnecting = () => {
    if (this.isConnecting) {
      void this.disconnect();
    }
  };
}

export const bluetoothM = new BluetoothM(getBluetoothStrategy);
