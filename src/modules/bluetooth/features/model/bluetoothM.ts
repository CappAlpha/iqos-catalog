import { makeAutoObservable, observable, runInAction } from "mobx";

import { BLUETOOTH_SUPPORT } from "@/shared/config/platform";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";
import { logsM, type IAppLogger } from "@/shared/lib/logger";
import { normalizeBatteryLevel } from "@/shared/lib/normalizeBatteryLevel";

import { getBluetoothStrategy } from "../lib/getBluetoothStrategy";
import { getEmptyDeviceInfo } from "../lib/readDeviceInfo";
import {
  BATTERY_REFRESH_ERROR_MESSAGE,
  BLE_CONNECT_TIMEOUT_MS,
  BLE_DISCONNECT_TIMEOUT_MS,
  CONNECT_ERROR_FALLBACK_MESSAGE,
  CONNECT_TIMEOUT_MESSAGE,
  CONNECTION_LOST_MESSAGE,
  DEVICE_CONFIG,
  DEVICE_NOT_SELECTED_ERRORS,
  DISCONNECT_TIMEOUT_MESSAGE,
  UNSUPPORTED_MESSAGE,
} from "./constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDevice,
  IBluetoothDeviceInfo,
  TBluetoothStatus,
} from "./types";

export class BluetoothM {
  device: IBluetoothDevice | null = null;
  status: TBluetoothStatus = "disconnected";
  error: string | null = null;
  batteryLevel: number | null = null;
  isRefreshingBattery = false;
  deviceInfo: IBluetoothDeviceInfo = getEmptyDeviceInfo();

  readonly #getStrategy: () => Promise<IBluetoothStrategy>;

  #strategy: IBluetoothStrategy | null = null;
  readonly #logsM: IAppLogger;
  #currentConnectionId = 0;
  #abortController: AbortController | null = null;

  constructor(
    getStrategy: () => Promise<IBluetoothStrategy>,
    logsM: IAppLogger,
  ) {
    this.#getStrategy = getStrategy;
    this.#logsM = logsM;

    makeAutoObservable(this, {
      device: observable.ref,
      deviceInfo: observable.ref,
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
    return BLUETOOTH_SUPPORT.transport !== null;
  }

  private readonly setConnected = ({
    device,
    batteryLevel,
    deviceInfo,
  }: IBluetoothConnectionResult) => {
    this.status = "connected";
    this.error = null;
    this.device = device;
    this.batteryLevel = batteryLevel;
    this.deviceInfo = deviceInfo;
  };

  private readonly reset = (error: string | null = null) => {
    this.device = null;
    this.status = "disconnected";
    this.error = error;
    this.batteryLevel = null;
    this.deviceInfo = getEmptyDeviceInfo();
  };

  private readonly abortActiveConnection = () => {
    this.#abortController?.abort();
    this.#abortController = null;
  };

  private readonly releaseAbortController = (controller: AbortController) => {
    if (this.#abortController === controller) {
      controller.abort();
      this.#abortController = null;
    }
  };

  private readonly isStale = (connectionId: number): boolean =>
    connectionId !== this.#currentConnectionId;

  private readonly isCancelled = (err: unknown): boolean => {
    const message = getErrorMessage(err, "");

    return (
      DEVICE_NOT_SELECTED_ERRORS.includes(message) ||
      (err instanceof DOMException &&
        (err.name === "NotFoundError" || err.name === "AbortError"))
    );
  };

  connect = async () => {
    if (this.isConnecting || this.isDisconnecting) {
      this.#logsM.warn(
        `[BLE_M] Отклонён повторный вызов connect. Статус: ${this.status}`,
      );
      return;
    }

    if (!this.isSupported) {
      this.#logsM.warn(`[BLE_M] ${UNSUPPORTED_MESSAGE}`);
      return;
    }

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    const controller = new AbortController();
    this.#abortController = controller;
    const signal = controller.signal;

    runInAction(() => {
      this.status = "connecting";
      this.error = null;
      this.batteryLevel = null;
      this.deviceInfo = getEmptyDeviceInfo();
    });

    let strategy: IBluetoothStrategy | null = null;

    try {
      strategy = await this.#getStrategy();

      if (this.isStale(connectionId)) {
        this.releaseAbortController(controller);
        await strategy.disconnect();
        return;
      }

      this.#strategy = strategy;

      const result = await actionPromiseWithTimeout(
        strategy.connect(DEVICE_CONFIG, this.handleDisconnect, signal),
        BLE_CONNECT_TIMEOUT_MS,
        CONNECT_TIMEOUT_MESSAGE,
      );

      if (this.isStale(connectionId)) {
        this.#logsM.warn(
          `[BLE_M] [ID:${connectionId}] Подключение устарело (актуальный ID: ${this.#currentConnectionId}). Освобождение ресурсов.`,
        );
        this.releaseAbortController(controller);
        await strategy.disconnect().catch((err) => {
          this.#logsM.error(
            `[BLE_M] [ID:${connectionId}] Ошибка при освобождении ресурсов`,
            err,
          );
        });
        return;
      }

      this.#logsM.success(
        `[BLE_M] [ID:${connectionId}] BLE-устройство подключено: "${result.device.name ?? "без имени"}", FW=${result.deviceInfo.firmwareRevision ?? "N/A"}, HW=${result.deviceInfo.hardwareRevision ?? "N/A"}, заряд=${result.batteryLevel !== null ? `${result.batteryLevel}%` : "не прочитан"}.`,
      );

      runInAction(() => this.setConnected(result));
    } catch (err) {
      this.releaseAbortController(controller);

      if (this.isStale(connectionId)) return;

      this.#logsM.error(`[BLE_M] [ID:${connectionId}] Сбой подключения`, err);

      await strategy?.disconnect().catch((cleanErr) => {
        this.#logsM.error(
          `[BLE_M] [ID:${connectionId}] Ошибка при принудительном отключении`,
          cleanErr,
        );
      });

      runInAction(() =>
        this.reset(
          this.isCancelled(err)
            ? null
            : getErrorMessage(err, CONNECT_ERROR_FALLBACK_MESSAGE),
        ),
      );
    }
  };

  private readonly handleDisconnect = () => {
    this.#currentConnectionId++;

    this.abortActiveConnection();

    runInAction(() => {
      if (this.status === "disconnecting") {
        this.reset();
      } else {
        this.#logsM.warn(`[BLE_M] ${CONNECTION_LOST_MESSAGE}`);
        this.reset(CONNECTION_LOST_MESSAGE);
      }
    });
  };

  disconnect = async () => {
    if (this.isDisconnecting) {
      this.#logsM.warn("[BLE_M] Отключение уже выполняется.");
      return;
    }
    if (!this.isConnected && !this.isConnecting) {
      this.#logsM.warn(
        `[BLE_M] Отключение отклонено: устройство не подключено. Статус: ${this.status}`,
      );
      return;
    }

    this.#currentConnectionId++;

    if (this.#abortController) {
      this.abortActiveConnection();
    }

    runInAction(() => {
      this.status = "disconnecting";
      this.error = null;
    });

    try {
      if (this.#strategy) {
        await actionPromiseWithTimeout(
          this.#strategy.disconnect(),
          BLE_DISCONNECT_TIMEOUT_MS,
          DISCONNECT_TIMEOUT_MESSAGE,
        );
      } else {
        this.#logsM.warn(
          "[BLE_M] Стратегия отсутствует, физический disconnect пропущен.",
        );
      }
    } catch (err) {
      this.#logsM.error("[BLE_M] Отключение завершилось с ошибкой", err);
    } finally {
      runInAction(() => this.reset(null));
    }
  };

  refreshBattery = async (): Promise<void> => {
    if (!this.isConnected) {
      this.#logsM.warn(
        "[BLE_M] Обновление батареи отклонено: устройство не подключено.",
      );
      return;
    }

    if (this.isRefreshingBattery) {
      this.#logsM.warn(
        "[BLE_M] Обновление батареи отклонено: предыдущее чтение ещё выполняется.",
      );
      return;
    }

    const connectionId = this.#currentConnectionId;
    this.isRefreshingBattery = true;

    try {
      const level = normalizeBatteryLevel(
        (await this.#strategy?.getBatteryLevel()) ?? null,
      );

      if (!this.isConnected || this.isStale(connectionId)) {
        this.#logsM.warn(
          "[BLE_M] Чтение батареи отменено: за время ожидания устройство отключилось.",
        );
        return;
      }

      runInAction(() => {
        this.batteryLevel = level;
      });
    } catch (err) {
      if (!this.isConnected || this.isStale(connectionId)) return;

      const errMsg = getErrorMessage(err, BATTERY_REFRESH_ERROR_MESSAGE);
      this.#logsM.error("[BLE_M] Ошибка чтения заряда батареи", err);

      runInAction(() => {
        this.error = errMsg;
      });
    } finally {
      runInAction(() => {
        this.isRefreshingBattery = false;
      });
    }
  };

  cancelIfConnecting = () => {
    if (this.isConnecting) {
      void this.disconnect();
    }
  };
}

export const bluetoothM = new BluetoothM(getBluetoothStrategy, logsM);
