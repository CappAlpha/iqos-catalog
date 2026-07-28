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
  deviceInfo: IBluetoothDeviceInfo = getEmptyDeviceInfo();

  readonly #getStrategy: () => Promise<IBluetoothStrategy>;

  private strategy: IBluetoothStrategy | null = null;
  private readonly logsM: IAppLogger;
  private currentConnectionId = 0;
  private abortController: AbortController | null = null;

  constructor(
    getStrategy: () => Promise<IBluetoothStrategy>,
    logsM: IAppLogger,
  ) {
    this.#getStrategy = getStrategy;
    this.logsM = logsM;

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

  connect = async () => {
    if (this.isConnecting || this.isDisconnecting) {
      this.logsM.warn(
        `[BLE] Отклонен повторный вызов connect. Текущий статус: ${this.status}`,
      );
      return;
    }

    this.currentConnectionId++;
    const connectionId = this.currentConnectionId;

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.logsM.info(`[BLE] [ID:${connectionId}] Запуск подключения...`);

    runInAction(() => {
      this.status = "connecting";
      this.error = null;
      this.batteryLevel = null;
      this.deviceInfo = getEmptyDeviceInfo();
    });

    try {
      if (!this.strategy) {
        this.logsM.info(
          `[BLE] [ID:${connectionId}] Загрузка стратегии подключения...`,
        );
        this.strategy = await this.#getStrategy();
        this.logsM.success(
          `[BLE] [ID:${connectionId}] Стратегия успешно загружена: ${this.strategy.constructor.name}`,
        );
      }

      this.logsM.info(
        `[BLE] [ID:${connectionId}] Ожидание выбора устройства и сопряжения. Лимит таймаута: ${CONNECT_TIMEOUT}мс`,
      );

      const result = await actionPromiseWithTimeout(
        this.strategy.connect(DEVICE_CONFIG, this.handleDisconnect, signal),
        CONNECT_TIMEOUT,
        "Время ожидания подключения истекло. Пожалуйста, закройте окно выбора устройств (нажмите «Отмена») и попробуйте подключиться снова.",
      );

      if (connectionId !== this.currentConnectionId) {
        this.logsM.warn(
          `[BLE] [ID:${connectionId}] Подключение устарело (актуальный ID: ${this.currentConnectionId}). Освобождение ресурсов.`,
        );
        this.abortController.abort();
        await this.strategy.disconnect().catch((err) => {
          this.logsM.error(
            `[BLE] [ID:${connectionId}] Ошибка при освобождении ресурсов`,
            err,
          );
        });
        return;
      }

      this.logsM.success(
        `[BLE] [ID:${connectionId}] Успешно подключено к BLE-серверу!`,
      );
      this.logsM.info(
        `[BLE] [ID:${connectionId}] Данные устройства: ${JSON.stringify(result.device)}`,
      );
      this.logsM.info(
        `[BLE] [ID:${connectionId}] Версии ПО/Железа: FW=${result.deviceInfo.firmwareRevision ?? "N/A"}, HW=${result.deviceInfo.hardwareRevision ?? "N/A"}`,
      );
      this.logsM.info(
        `[BLE] [ID:${connectionId}] Уровень заряда батареи при подключении: ${result.batteryLevel !== null ? `${result.batteryLevel}%` : "не прочитан"}`,
      );

      runInAction(() => {
        this.setConnected(result);
      });
    } catch (err) {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      if (connectionId !== this.currentConnectionId) {
        this.logsM.warn(
          `[BLE] [ID:${connectionId}] Ошибка в устаревшем потоке подключения проигнорирована.`,
        );
        return;
      }

      this.logsM.error(
        `[BLE] [ID:${connectionId}] Сбой в процессе подключения`,
        err,
      );

      if (this.device) {
        this.logsM.info(
          `[BLE] [ID:${connectionId}] Принудительный разрыв физического соединения (GATT)...`,
        );
      } else {
        this.logsM.info(
          `[BLE] [ID:${connectionId}] Локальная очистка ресурсов стратегии (соединение не было установлено)...`,
        );
      }

      await this.strategy?.disconnect().catch((cleanErr) => {
        this.logsM.error(
          `[BLE] [ID:${connectionId}] Ошибка при принудительном отключении`,
          cleanErr,
        );
      });

      let errMsg = getErrorMessage(err, "Ошибка подключения по Bluetooth.");

      if (errMsg === "User cancelled the requestDevice() chooser.") {
        errMsg = "Вы отменили выбор устройства.";
      }

      runInAction(() => {
        this.reset(errMsg);
      });
    }
  };

  private readonly handleDisconnect = () => {
    this.currentConnectionId++;
    const connectionId = this.currentConnectionId;

    runInAction(() => {
      if (this.status === "disconnecting") {
        this.logsM.info(
          `[BLE] [ID:${connectionId}] Физическое отключение устройства выполнено штатно по инициативе пользователя.`,
        );
        this.reset();
      } else {
        const warningMsg =
          "Соединение разорвано: устройство отключено или вышло из зоны действия.";
        this.logsM.warn(`[BLE] [ID:${connectionId}] ${warningMsg}`);
        this.reset(warningMsg);
      }
    });
  };

  disconnect = async () => {
    if (this.isDisconnecting) {
      this.logsM.warn(
        "[BLE] Запрос на отключение отклонен: процесс уже выполняется.",
      );
      return;
    }
    if (!this.isConnected && !this.isConnecting) {
      this.logsM.warn(
        `[BLE] Запрос на отключение отклонен: устройство не подключено. Статус: ${this.status}`,
      );
      return;
    }

    const wasConnecting = this.isConnecting;
    this.currentConnectionId++;
    const connectionId = this.currentConnectionId;

    this.logsM.info(
      `[BLE] [ID:${connectionId}] Инициирован ручной разрыв соединения. Текущий статус: ${this.status}`,
    );

    if (this.abortController) {
      this.logsM.info(
        `[BLE] [ID:${connectionId}] Отмена активной попытки подключения через AbortSignal.`,
      );
      this.abortController.abort();
      this.abortController = null;
    }

    runInAction(() => {
      this.status = "disconnecting";
      this.error = null;
    });

    try {
      if (this.strategy) {
        this.logsM.info(
          `[BLE] [ID:${connectionId}] Ожидание завершения логического отключения стратегии...`,
        );

        await actionPromiseWithTimeout(
          this.strategy.disconnect(),
          DISCONNECT_TIMEOUT,
          "Таймаут физического отключения",
        );

        this.logsM.success(
          `[BLE] [ID:${connectionId}] Логический разрыв связи с GATT-сервером выполнен.`,
        );
      } else {
        this.logsM.warn(
          `[BLE] [ID:${connectionId}] Стратегия отсутствует, пропускаем физический disconnect.`,
        );
      }
    } catch (err) {
      this.logsM.error(
        `[BLE] [ID:${connectionId}] Физическое отключение завершилось с ошибкой`,
        err,
      );
    } finally {
      runInAction(() => {
        this.reset(wasConnecting ? "Подключение отменено." : null);
      });
      this.logsM.info(
        `[BLE] [ID:${connectionId}] Сброс состояния стора завершен.`,
      );
    }
  };

  refreshBattery = async (): Promise<void> => {
    if (!this.isConnected) {
      this.logsM.warn(
        "[BLE] Запрос на обновление батареи отклонен: устройство не подключено.",
      );
      return;
    }

    this.logsM.info("[BLE] Запрос чтения уровня заряда батареи...");

    try {
      const level = (await this.strategy?.getBatteryLevel()) ?? null;

      if (!this.isConnected) {
        this.logsM.warn(
          "[BLE] Чтение батареи отменено: за время ожидания ответа устройство отключилось.",
        );
        return;
      }

      this.logsM.success(
        `[BLE] Уровень заряда батареи получен: ${level !== null ? `${level}%` : "не прочитан"}`,
      );

      runInAction(() => {
        this.batteryLevel = level;
      });
    } catch (err) {
      if (!this.isConnected) return;

      const errMsg = getErrorMessage(err, "Не удалось обновить заряд батареи.");
      this.logsM.error("[BLE] Ошибка чтения заряда батареи", err);

      runInAction(() => {
        this.error = errMsg;
      });
    }
  };

  cancelIfConnecting = () => {
    if (this.isConnecting) {
      this.logsM.warn(
        "[BLE] Получен запрос на отмену операции в процессе соединения.",
      );
      void this.disconnect();
    }
  };
}

export const bluetoothM = new BluetoothM(getBluetoothStrategy, logsM);
