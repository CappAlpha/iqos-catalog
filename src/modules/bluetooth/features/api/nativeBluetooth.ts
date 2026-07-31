import { BleClient } from "@capacitor-community/bluetooth-le";

import { logsM } from "@/modules/logs/features/model/logsM";
import { IS_ANDROID, IS_IOS } from "@/shared/config/platform";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { createCharReader } from "../lib/readCharacteristic";
import { readInitialMetadata } from "../lib/readInitialMetadata";
import { BATTERY, REQUIRED_SERVICES } from "../model/constants";
import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";
import { BaseBluetoothStrategy } from "./baseBluetoothStrategy";

const LOG_PREFIX = "[NativeBluetooth]";

/**
 * Реализация {@link BaseBluetoothStrategy} поверх нативного плагина
 * @capacitor-community/bluetooth-le (Android / iOS).
 *
 * Физическое подключение/отключение и чтение характеристик делегируются BleClient.
 * Системное событие разрыва приходит через колбэк `BleClient.connect` и
 * транслируется в `notifyDisconnected()` базового класса.
 */
export class NativeBluetooth extends BaseBluetoothStrategy {
  protected readonly logPrefix = LOG_PREFIX;

  // ID выбранного устройства. Обнуляется в doDisconnect при разрыве.
  private deviceId: string | null = null;

  /**
   * Подключение к устройству: проверка состояния Bluetooth → выбор устройства →
   * физическое соединение → чтение начальных метаданных.
   *
   * withDisconnectCallback регистрирует onDisconnect ДО action и гарантирует
   * очистку ресурсов при ошибке подключения (без вызова колбэка — об ошибке
   * сообщит сам reject).
   */
  connect = async (
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
    signal?: AbortSignal,
  ): Promise<IBluetoothConnectionResult> => {
    return this.withDisconnectCallback(onDisconnect, async () => {
      const isBluetoothEnabled = await BleClient.isEnabled();
      if (!isBluetoothEnabled) {
        if (IS_ANDROID) {
          await BleClient.requestEnable();
        } else if (IS_IOS) {
          throw new Error(
            "Bluetooth выключен. Включите его в настройках устройства.",
          );
        }
      }

      const device = await BleClient.requestDevice({
        // TODO: remove comment on release
        // services: config.services,
        optionalServices: [...REQUIRED_SERVICES],
      });

      signal?.throwIfAborted();

      logsM.success(
        `${LOG_PREFIX} Устройство выбрано: "${device.name ?? "Без имени"}" (ID: ${device.deviceId})`,
      );

      this.deviceId = device.deviceId;

      await BleClient.connect(device.deviceId, () => {
        this.handlePluginDisconnect();
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
    });
  };

  /** Чтение уровня заряда батареи (Battery Service 0x180F, характеристика 0x2A19). */
  getBatteryLevel = async (): Promise<number | null> => {
    if (!this.deviceId) {
      logsM.warn(`${LOG_PREFIX} Чтение батареи отклонено: нет ID устройства.`);
      return null;
    }

    logsM.info(`${LOG_PREFIX} Чтение уровня заряда батареи...`);

    try {
      const value = await BleClient.read(
        this.deviceId,
        BATTERY.SERVICE,
        BATTERY.LEVEL,
      );
      if (value.byteLength === 0) return null;
      const level = value.getUint8(0);
      logsM.info(`${LOG_PREFIX} Заряд батареи: ${level}%`);
      return level;
    } catch (err) {
      logsM.warn(
        `${LOG_PREFIX} Ошибка чтения заряда: ${getErrorMessage(err, "неизвестная")}`,
      );
      return null;
    }
  };

  /** Физический разрыв: обнуляем ID и просим плагин разорвать соединение. */
  protected doDisconnect = async (): Promise<void> => {
    const idToDisconnect = this.deviceId;
    this.deviceId = null;
    if (idToDisconnect) {
      await BleClient.disconnect(idToDisconnect);
    }
  };

  /**
   * Системное событие разрыва от плагина @capacitor-community/bluetooth-le
   * (колбэк BleClient.connect). Транслируется в notifyDisconnected() базового
   * класса, который вызовет onDisconnect-колбэк стора.
   */
  private readonly handlePluginDisconnect = (): void => {
    logsM.warn(`${LOG_PREFIX} Системное событие отключения от плагина.`);
    this.notifyDisconnected();
  };
}
