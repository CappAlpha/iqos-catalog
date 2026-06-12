import { makeAutoObservable, observable } from "mobx";

import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { getBluetoothStrategy } from "../lib/getBluetoothStrategy";
import { UUIDS } from "./constants";
import type { BluetoothConnectionResult, IBluetooth } from "./types";

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

  readonly #getStrategy: () => IBluetooth;
  #strategy: IBluetooth | null = null;

  #currentConnectionId = 0;

  constructor(getStrategy: () => IBluetooth) {
    this.#getStrategy = getStrategy;
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

  private readonly transitionTo = (
    status: BluetoothStatus,
    error: string | null = null,
  ) => {
    this.status = status;
    this.error = error;
  };

  private readonly setConnected = ({
    services,
    batteryLevel,
    device,
  }: BluetoothConnectionResult) => {
    this.status = "connected";
    this.error = null;
    this.services = services;
    this.batteryLevel = batteryLevel;
    this.device = device ?? null;
  };

  private readonly reset = (error: string | null = null) => {
    this.device = null;
    this.status = "disconnected";
    this.error = error;
    this.services = [];
    this.batteryLevel = null;
    this.#strategy = null;
  };

  connect = async (
    targetServiceUuid: string = UUIDS.IQOS_CONTROL,
    fallbackName: string = "Неизвестное блютуз устройство",
  ) => {
    if (this.status === "connecting" || this.status === "disconnecting") {
      return;
    }

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    this.status = "connecting";
    this.error = null;
    this.batteryLevel = null;
    this.services = [];

    if (connectionId !== this.#currentConnectionId) return;

    try {
      this.#strategy = this.#getStrategy();

      if (!this.#strategy) {
        this.reset("Bluetooth недоступен.");
        return;
      }

      const result = await this.#strategy.connect(
        targetServiceUuid,
        fallbackName,
        this.handleDisconnect,
      );

      if (connectionId !== this.#currentConnectionId) {
        void this.#strategy.disconnect().catch(() => {});
        return;
      }

      this.setConnected(result);
    } catch (err) {
      if (connectionId !== this.#currentConnectionId) {
        return;
      }

      void this.#strategy?.disconnect().catch(() => {});

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
    if (!this.isConnected || !this.#strategy) return;

    try {
      const battery = await this.#strategy.getBatteryLevel();

      if (!this.isConnected) return;

      this.batteryLevel = battery;
    } catch (err) {
      if (!this.isConnected) return;

      this.transitionTo(
        this.status,
        getErrorMessage(err, "Не удалось обновить заряд батареи"),
      );
    }
  };

  disconnect = async () => {
    if (this.isDisconnecting || (!this.isConnected && !this.isConnecting)) {
      return;
    }

    const wasConnecting = this.isConnecting;
    this.transitionTo("disconnecting");

    this.#currentConnectionId++;

    try {
      if (this.#strategy) {
        await actionPromiseWithTimeout(
          this.#strategy.disconnect(),
          3000,
          "Таймаут физического отключения",
        );
      }
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
