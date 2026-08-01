import { makeAutoObservable, observable, runInAction } from "mobx";

import { logsM } from "@/modules/logs/features/model/logsM";
import type { IAppLogger } from "@/modules/logs/features/model/types";
import {
  IS_CAPACITOR,
  IS_NATIVE_BLUETOOTH_AVAILABLE,
  IS_WEB_BLUETOOTH_SUPPORTED,
} from "@/shared/config/platform";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { getBluetoothStrategy } from "../lib/getBluetoothStrategy";
import { getEmptyDeviceInfo } from "../lib/readDeviceInfo";
import {
  CONNECT_TIMEOUT,
  DEVICE_CONFIG,
  DISCONNECT_TIMEOUT,
  UNSUPPORTED_MSG,
} from "./constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceInfo,
  IBluetoothDevice,
} from "./types";

type BluetoothStatus =
  "disconnected" | "connecting" | "connected" | "disconnecting";

class BluetoothM {
  device: IBluetoothDevice | null = null;
  status: BluetoothStatus = "disconnected";
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
    return IS_CAPACITOR
      ? IS_NATIVE_BLUETOOTH_AVAILABLE
      : IS_WEB_BLUETOOTH_SUPPORTED;
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

  connect = async () => {
    if (this.isConnecting || this.isDisconnecting) {
      this.#logsM.warn(
        `[BLE] Отклонён повторный вызов connect. Статус: ${this.status}`,
      );
      return;
    }

    if (!this.isSupported) {
      this.#logsM.warn(`[BLE] ${UNSUPPORTED_MSG}`);
      runInAction(() => this.reset(UNSUPPORTED_MSG));
      return;
    }

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    this.#abortController = new AbortController();
    const signal = this.#abortController.signal;

    this.#logsM.info(`[BLE] [ID:${connectionId}] Запуск подключения...`);

    runInAction(() => {
      this.status = "connecting";
      this.error = null;
      this.batteryLevel = null;
      this.deviceInfo = getEmptyDeviceInfo();
    });

    let strategy: IBluetoothStrategy | null = null;

    try {
      this.#logsM.info(
        `[BLE] [ID:${connectionId}] Загрузка стратегии подключения...`,
      );
      strategy = await this.#getStrategy();

      if (connectionId !== this.#currentConnectionId) {
        await strategy.disconnect();
        return;
      }

      this.#strategy = strategy;
      this.#logsM.success(
        `[BLE] [ID:${connectionId}] Стратегия загружена: ${strategy.constructor.name}`,
      );

      this.#logsM.info(
        `[BLE] [ID:${connectionId}] Ожидание выбора устройства (таймаут ${CONNECT_TIMEOUT}мс).`,
      );

      const result = await actionPromiseWithTimeout(
        strategy.connect(DEVICE_CONFIG, this.handleDisconnect, signal),
        CONNECT_TIMEOUT,
        "Время ожидания подключения истекло. Закройте окно выбора устройств и попробуйте снова.",
      );

      if (connectionId !== this.#currentConnectionId) {
        this.#logsM.warn(
          `[BLE] [ID:${connectionId}] Подключение устарело (актуальный ID: ${this.#currentConnectionId}). Освобождение ресурсов.`,
        );
        this.abortActiveConnection();
        await strategy.disconnect().catch((err) => {
          this.#logsM.error(
            `[BLE] [ID:${connectionId}] Ошибка при освобождении ресурсов`,
            err,
          );
        });
        return;
      }

      this.#logsM.success(
        `[BLE] [ID:${connectionId}] Подключено к BLE-устройству.`,
      );
      this.#logsM.info(
        `[BLE] [ID:${connectionId}] FW=${result.deviceInfo.firmwareRevision ?? "N/A"}, HW=${result.deviceInfo.hardwareRevision ?? "N/A"}, заряд=${result.batteryLevel !== null ? `${result.batteryLevel}%` : "не прочитан"}`,
      );

      runInAction(() => this.setConnected(result));
    } catch (err) {
      this.abortActiveConnection();

      if (connectionId !== this.#currentConnectionId) {
        this.#logsM.warn(
          `[BLE] [ID:${connectionId}] Ошибка в устаревшем потоке подключения проигнорирована.`,
        );
        return;
      }

      this.#logsM.error(`[BLE] [ID:${connectionId}] Сбой подключения`, err);
      this.#logsM.info(
        `[BLE] [ID:${connectionId}] Разрыв соединения и очистка ресурсов...`,
      );

      await strategy?.disconnect().catch((cleanErr) => {
        this.#logsM.error(
          `[BLE] [ID:${connectionId}] Ошибка при принудительном отключении`,
          cleanErr,
        );
      });

      let errMsg = getErrorMessage(err, "Ошибка подключения по Bluetooth.");
      if (errMsg === "User cancelled the requestDevice() chooser.") {
        errMsg = "Вы отменили выбор устройства.";
      }

      runInAction(() => this.reset(errMsg));
    }
  };

  private readonly handleDisconnect = () => {
    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    this.abortActiveConnection();

    runInAction(() => {
      if (this.status === "disconnecting") {
        this.#logsM.info(
          `[BLE] [ID:${connectionId}] Отключение выполнено по инициативе пользователя.`,
        );
        this.reset();
      } else {
        const warningMsg =
          "Соединение разорвано: устройство отключено или вышло из зоны действия.";
        this.#logsM.warn(`[BLE] [ID:${connectionId}] ${warningMsg}`);
        this.reset(warningMsg);
      }
    });
  };

  disconnect = async () => {
    if (this.isDisconnecting) {
      this.#logsM.warn("[BLE] Отключение уже выполняется.");
      return;
    }
    if (!this.isConnected && !this.isConnecting) {
      this.#logsM.warn(
        `[BLE] Отключение отклонено: устройство не подключено. Статус: ${this.status}`,
      );
      return;
    }

    const wasConnecting = this.isConnecting;
    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    this.#logsM.info(
      `[BLE] [ID:${connectionId}] Ручной разрыв соединения. Статус: ${this.status}`,
    );

    if (this.#abortController) {
      this.#logsM.info(
        `[BLE] [ID:${connectionId}] Отмена активной попытки подключения через AbortSignal.`,
      );
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
          DISCONNECT_TIMEOUT,
          "Таймаут физического отключения",
        );
        this.#logsM.success(
          `[BLE] [ID:${connectionId}] Разрыв GATT-соединения выполнен.`,
        );
      } else {
        this.#logsM.warn(
          `[BLE] [ID:${connectionId}] Стратегия отсутствует, физический disconnect пропущен.`,
        );
      }
    } catch (err) {
      this.#logsM.error(
        `[BLE] [ID:${connectionId}] Отключение завершилось с ошибкой`,
        err,
      );
    } finally {
      runInAction(() =>
        this.reset(wasConnecting ? "Подключение отменено." : null),
      );
      this.#logsM.info(`[BLE] [ID:${connectionId}] Состояние стора сброшено.`);
    }
  };

  refreshBattery = async (): Promise<void> => {
    if (!this.isConnected || this.isRefreshingBattery) {
      this.#logsM.warn(
        "[BLE] Обновление батареи отклонено: устройство не подключено.",
      );
      return;
    }

    this.isRefreshingBattery = true;
    this.#logsM.info("[BLE] Чтение уровня заряда батареи...");

    try {
      const level = (await this.#strategy?.getBatteryLevel()) ?? null;

      if (!this.isConnected) {
        this.#logsM.warn(
          "[BLE] Чтение батареи отменено: за время ожидания устройство отключилось.",
        );
        return;
      }

      this.#logsM.success(
        `[BLE] Заряд получен: ${level !== null ? `${level}%` : "не прочитан"}`,
      );

      runInAction(() => {
        this.batteryLevel = level;
      });
    } catch (err) {
      if (!this.isConnected) return;

      const errMsg = getErrorMessage(err, "Не удалось обновить заряд батареи.");
      this.#logsM.error("[BLE] Ошибка чтения заряда батареи", err);

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
      this.#logsM.warn("[BLE] Запрос на отмену подключения.");
      void this.disconnect();
    }
  };
}

export const bluetoothM = new BluetoothM(getBluetoothStrategy, logsM);
