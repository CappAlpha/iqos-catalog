import { BleClient } from "@capacitor-community/bluetooth-le";

import { logsM } from "@/modules/logs/features/model/logsM";
import { IS_ANDROID } from "@/shared/config/platform";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { createCharReader } from "../lib/readCharacteristic";
import { readInitialMetadata } from "../lib/readInitialMetadata";
import { BATTERY } from "../model/constants";
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
      const isBluetoothEnabled = await BleClient.isEnabled();
      if (!isBluetoothEnabled && IS_ANDROID) {
        // TODO: on IOS request not working?
        await BleClient.requestEnable();
      }

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

      await BleClient.connect(device.deviceId, () => {
        void this.handleDisconnect();
      });

      signal?.throwIfAborted();

      const read = createCharReader(async (svc, chr) => {
        return await BleClient.read(device.deviceId, svc, chr);
      });

      const { deviceName, deviceInfo, batteryLevel } =
        await readInitialMetadata(
          read,
          () => this.getBatteryLevel(),
          device.name ?? null,
          signal,
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
      } catch (err) {
        const errMsg = getErrorMessage(
          err,
          "[NativeBluetooth] Ошибка при закрытии соединения Bluetooth.",
        );
        logsM.warn(
          `[NativeBluetooth] Ошибка при закрытии соединения Bluetooth. Причина: ${errMsg}`,
        );
      }
    }

    if (triggerCallback && wasConnected) {
      callback?.();
    }
    this.isDisconnecting = false;
  };

  private readonly handleDisconnect = async () => {
    if (this.isDisconnecting) return;
    logsM.warn(
      "[NativeBluetooth] Получено системное событие отключения от плагина (handleDisconnect).",
    );
    await this.cleanup(true);
  };
}
