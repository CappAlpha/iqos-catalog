import { BleClient } from "@capacitor-community/bluetooth-le";

import { IS_ANDROID, IS_IOS } from "@/shared/config/platform";
import { BaseConnectionStrategy } from "@/shared/lib/baseConnectionStrategy";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";
import { logsM } from "@/shared/lib/logger";

import { createCharReader } from "../lib/readCharacteristic";
import { readInitialMetadata } from "../lib/readInitialMetadata";
import { BATTERY, REQUIRED_SERVICES } from "../model/constants";
import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

const LOG_PREFIX = "[NativeBluetooth]";

/**
 * Реализация {@link BaseConnectionStrategy} поверх нативного плагина
 * @capacitor-community/bluetooth-le (Android / iOS).
 *
 * Физическое подключение/отключение и чтение характеристик делегируются BleClient.
 * Системное событие разрыва приходит через колбэк `BleClient.connect` и
 * транслируется в `notifyDisconnected()` базового класса.
 */
export class NativeBluetooth extends BaseConnectionStrategy<
  IBluetoothDeviceConfig,
  IBluetoothConnectionResult
> {
  protected readonly logPrefix = LOG_PREFIX;
  protected readonly disconnectErrorMessage =
    "Ошибка при разрыве GATT-соединения";
  protected readonly manualDisconnectMessage = "Ручной disconnect.";

  /** Создаёт стратегию native Bluetooth с общим logger приложения. */
  constructor() {
    super(logsM);
  }

  private deviceId: string | null = null;

  /**
   * Подключает BLE-устройство через Capacitor-плагин.
   *
   * Последовательность операции: проверка состояния Bluetooth, выбор устройства,
   * GATT-подключение и чтение начальных метаданных. Ошибки отдельных BLE-
   * характеристик обрабатываются внутри `readInitialMetadata` и не отменяют
   * подключение, если само GATT-соединение успешно.
   *
   * @param config конфигурация BLE-сервисов;
   * @param onDisconnect callback системного отключения устройства;
   * @param signal необязательный сигнал отмены выбора или чтения данных;
   * @returns идентификатор, имя, metadata и начальный заряд устройства;
   * @throws если Bluetooth выключен, permission отклонён, устройство не выбрано
   * или native-плагин не смог установить GATT-соединение;
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
        // TODO: remove comment on release, need all devices for test now
        // services: config.services,
        optionalServices: [...REQUIRED_SERVICES],
      });

      if (!this.isOperationActive()) {
        throw new DOMException("Подключение отменено.", "AbortError");
      }

      signal?.throwIfAborted();

      logsM.success(
        `${LOG_PREFIX} Устройство выбрано: "${device.name ?? "Без имени"}" (ID: ${device.deviceId})`,
      );

      this.deviceId = device.deviceId;

      await BleClient.connect(device.deviceId, () => {
        this.handlePluginDisconnect();
      });

      if (!this.isOperationActive()) {
        await this.cleanupTransport();
        throw new DOMException("Подключение отменено.", "AbortError");
      }

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

  /**
   * Читает Battery Level characteristic через native BLE-плагин.
   *
   * @returns заряд в процентах или `null`, если устройство не подключено,
   * характеристика пустая либо чтение завершилось ошибкой;
   */
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

  /** Закрывает native GATT-соединение и очищает идентификатор устройства. */
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
