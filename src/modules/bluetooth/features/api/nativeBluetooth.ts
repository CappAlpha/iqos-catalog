import { BleClient } from "@capacitor-community/bluetooth-le";

import { logsM } from "@/modules/logs/features/model/logsM";
import { IS_ANDROID } from "@/shared/config/platform";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { createCharReader } from "../lib/readCharacteristic";
import { getEmptyDeviceInfo, readDeviceInfo } from "../lib/readDeviceInfo";
import { GAP, BATTERY } from "../model/constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

export class NativeBluetooth implements IBluetoothStrategy {
  private deviceId: string | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private isDisconnecting = false;

  connect = async (
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
    signal?: AbortSignal,
  ): Promise<IBluetoothConnectionResult> => {
    await this.cleanup(false);

    try {
      logsM.info(
        "[NativeBluetooth] Проверка статуса Bluetooth-модуля на устройстве...",
      );
      const isBluetoothEnabled = await BleClient.isEnabled();
      if (!isBluetoothEnabled) {
        if (IS_ANDROID) {
          logsM.info(
            "[NativeBluetooth] Bluetooth выключен. Отправка системного запроса на включение Bluetooth...",
          );
          // TODO: on IOS request not working?
          await BleClient.requestEnable();
        }
      }

      logsM.info(
        "[NativeBluetooth] Запуск нативного диалога выбора Bluetooth-устройства...",
      );
      const device = await BleClient.requestDevice({
        // TODO: remove comment on release
        // services: config.services,
        optionalServices: [BATTERY.SERVICE, ...config.services],
      });

      signal?.throwIfAborted();

      logsM.success(
        `[NativeBluetooth] Устройство успешно выбрано: "${device.name ?? "Без имени"}" (ID: ${device.deviceId})`,
      );

      this.deviceId = device.deviceId;
      this.onDisconnectCallback = onDisconnect;

      logsM.info(
        "[NativeBluetooth] Попытка физического подключения к GATT-серверу устройства...",
      );
      await BleClient.connect(device.deviceId, () => {
        void this.handleDisconnect();
      });
      logsM.success(
        "[NativeBluetooth] Физическое подключение к GATT-серверу успешно установлено.",
      );

      signal?.throwIfAborted();

      const read = createCharReader(async (svc, chr) => {
        try {
          return await BleClient.read(device.deviceId, svc, chr);
        } catch (err) {
          const errMsg = getErrorMessage(
            err,
            "[NativeBluetooth] Ошибка чтения характеристики.",
          );
          logsM.warn(
            `[NativeBluetooth] Ошибка чтения характеристики. Service: ${svc}, Char: ${chr} [ERROR]: ${errMsg}`,
          );
          throw err;
        }
      });

      logsM.info(
        "[NativeBluetooth] Запуск параллельного чтения базовых характеристик (Имя, Информация об устройстве, Батарея)...",
      );
      const [nameResult, infoResult, batteryResult] = await Promise.allSettled([
        read(GAP.SERVICE, GAP.DEVICE_NAME),
        readDeviceInfo(read),
        this.getBatteryLevel(),
      ]);

      let connectedName: string | null = null;
      if (nameResult.status === "fulfilled" && nameResult.value !== null) {
        connectedName = nameResult.value;
        logsM.info(
          `[NativeBluetooth] Имя устройства из GAP-сервиса успешно прочитано: "${connectedName}"`,
        );
      } else {
        const reasonStr =
          nameResult.status === "rejected"
            ? nameResult.reason instanceof Error
              ? nameResult.reason.message
              : typeof nameResult.reason === "string"
                ? nameResult.reason
                : "Неизвестная ошибка"
            : "Характеристика заблокирована нативной системой или отсутствует на устройстве";
        logsM.warn(
          `[NativeBluetooth] Не удалось получить имя из GAP-сервиса. Причина: ${reasonStr}`,
        );
      }

      const deviceName: string | null = connectedName ?? device.name ?? null;

      let deviceInfo = getEmptyDeviceInfo();
      if (
        infoResult.status === "fulfilled" &&
        infoResult.value.manufacturerName !== null
      ) {
        deviceInfo = infoResult.value;
        logsM.success(
          `[NativeBluetooth] Информация об устройстве (DeviceInfo) успешно прочитана: ${JSON.stringify(deviceInfo)}`,
        );
      } else {
        const reasonStr =
          infoResult.status === "rejected"
            ? infoResult.reason instanceof Error
              ? infoResult.reason.message
              : typeof infoResult.reason === "string"
                ? infoResult.reason
                : "Неизвестная ошибка"
            : "Сервис DeviceInfo отсутствует на устройстве или заблокирован нативной системой";
        logsM.warn(
          `[NativeBluetooth] Не удалось прочитать DeviceInfo. Причина: ${reasonStr}`,
        );
      }

      let batteryLevel: number | null = null;
      if (
        batteryResult.status === "fulfilled" &&
        batteryResult.value !== null
      ) {
        batteryLevel = batteryResult.value;
        logsM.info(
          `[NativeBluetooth] Уровень заряда батареи успешно прочитан: ${batteryLevel}%`,
        );
      } else {
        const reasonStr =
          batteryResult.status === "rejected"
            ? batteryResult.reason instanceof Error
              ? batteryResult.reason.message
              : typeof batteryResult.reason === "string"
                ? batteryResult.reason
                : "Неизвестная ошибка"
            : "Сервис батареи отсутствует на устройстве или заблокирован нативной системой";
        logsM.warn(
          `[NativeBluetooth] Не удалось получить заряд батареи на этапе сопряжения. Причина: ${reasonStr}`,
        );
      }

      signal?.throwIfAborted();

      logsM.success(
        `[NativeBluetooth] Процесс сопряжения и инициализации завершен для "${deviceName}"`,
      );

      return {
        device: {
          id: device.deviceId,
          name: deviceName,
        },
        deviceInfo,
        batteryLevel,
      };
    } catch (err) {
      if (signal?.aborted) {
        logsM.warn(
          "[NativeBluetooth] Операция сопряжения была отменена по сигналу Abort (таймаут).",
        );
      } else {
        logsM.error(
          "[NativeBluetooth] Сбой в процессе подключения через Native Bluetooth",
          err,
        );
      }

      await this.cleanup(false);

      const message = getErrorMessage(
        err,
        "Не удалось подключиться через Bluetooth.",
      );
      throw new Error(message, { cause: err });
    }
  };

  disconnect = async () => {
    logsM.info("[NativeBluetooth] Вызван ручной метод disconnect.");
    await this.cleanup();
  };

  getBatteryLevel = async () => {
    if (!this.deviceId) {
      logsM.warn(
        "[NativeBluetooth] Запрос чтения батареи отклонен: ID устройства отсутствует.",
      );
      return null;
    }

    try {
      logsM.info("[NativeBluetooth] Чтение уровня заряда батареи...");
      const batteryLevel = await BleClient.read(
        this.deviceId,
        BATTERY.SERVICE,
        BATTERY.LEVEL,
      );

      if (batteryLevel.byteLength === 0) {
        logsM.warn(
          "[NativeBluetooth] Прочитано пустое значение батареи (byteLength === 0).",
        );
        return null;
      }

      const level = batteryLevel.getUint8(0);
      logsM.info(`[NativeBluetooth] Прочитано значение батареи: ${level}%`);
      return level;
    } catch (err) {
      const errMsg = getErrorMessage(
        err,
        "[NativeBluetooth] Ошибка при чтении заряда батареи.",
      );
      logsM.warn(
        `[NativeBluetooth] Ошибка при чтении заряда батареи. Причина: ${errMsg}`,
      );
      return null;
    }
  };

  private readonly cleanup = async (triggerCallback = false) => {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;

    logsM.info(
      "[NativeBluetooth] Освобождение нативных ресурсов и зануление ссылок...",
    );

    const callback = this.onDisconnectCallback;
    const idToDisconnect = this.deviceId;
    const wasConnected = !!idToDisconnect;

    this.deviceId = null;
    this.onDisconnectCallback = null;

    if (idToDisconnect) {
      try {
        logsM.info(
          `[NativeBluetooth] Отправка запроса на отключение GATT-сервера (BleClient.disconnect) для ID: ${idToDisconnect}...`,
        );
        await BleClient.disconnect(idToDisconnect);
        logsM.info(
          "[NativeBluetooth] Запрос BleClient.disconnect() выполнен. Физическое закрытие канала контролируется ОС.",
        );
      } catch (err) {
        const errMsg = getErrorMessage(
          err,
          "[NativeBluetooth] Ошибка при закрытии соединения Bluetooth.",
        );
        logsM.warn(
          `[NativeBluetooth] Ошибка при закрытии соединения Bluetooth. Причина: ${errMsg}`,
        );
      }
    } else {
      logsM.info(
        "[NativeBluetooth] Локальная очистка ссылок (соединение не было установлено).",
      );
    }

    this.isDisconnecting = false;
    logsM.info("[NativeBluetooth] Очистка ресурсов NativeBluetooth завершена.");

    if (triggerCallback && wasConnected) {
      callback?.();
    }
  };

  private readonly handleDisconnect = async () => {
    if (this.isDisconnecting) return;
    logsM.warn(
      "[NativeBluetooth] Получено системное событие отключения от плагина (handleDisconnect).",
    );
    await this.cleanup(true);
  };
}
