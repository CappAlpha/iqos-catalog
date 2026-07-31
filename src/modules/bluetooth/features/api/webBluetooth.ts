import { logsM } from "@/modules/logs/features/model/logsM";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { createCharReader } from "../lib/readCharacteristic";
import { getEmptyDeviceInfo } from "../lib/readDeviceInfo";
import { readInitialMetadata } from "../lib/readInitialMetadata";
import { BATTERY, REQUIRED_SERVICES } from "../model/constants";
import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";
import { BaseBluetoothStrategy } from "./baseBluetoothStrategy";

const LOG_PREFIX = "[WebBluetooth]";
const GATT_CONNECT_TIMEOUT = 10_000;

/**
 * Реализация {@link BaseBluetoothStrategy} поверх Web Bluetooth API (браузер).
 *
 * Физическое подключение/отключение и чтение характеристик делегируются navigator.bluetooth.
 * Системное событие разрыва приходит через `gattserverdisconnected` и транслируется
 * в `notifyDisconnected()` базового класса.
 */
export class WebBluetooth extends BaseBluetoothStrategy {
  protected readonly logPrefix = LOG_PREFIX;

  private device: BluetoothDevice | null = null;

  /**
   * Подключение к устройству: выбор устройства → физическое GATT-соединение →
   * чтение начальных метаданных.
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
      const selectedDevice: BluetoothDevice =
        await navigator.bluetooth.requestDevice({
          // TODO: remove comment and acceptAllDevices on release
          // filters: [{ services: config.services }],
          acceptAllDevices: true,
          optionalServices: [...REQUIRED_SERVICES],
        });

      signal?.throwIfAborted();

      logsM.success(
        `${LOG_PREFIX} Устройство выбрано: "${selectedDevice.name ?? "Без имени"}" (ID: ${selectedDevice.id})`,
      );

      const gatt = selectedDevice.gatt;
      if (!gatt) {
        logsM.warn(
          `${LOG_PREFIX} У устройства "${selectedDevice.name ?? "Без имени"}" нет GATT-сервера.`,
        );
        return {
          device: { id: selectedDevice.id, name: selectedDevice.name ?? null },
          deviceInfo: getEmptyDeviceInfo(),
          batteryLevel: null,
        };
      }

      this.device = selectedDevice;

      await actionPromiseWithTimeout(
        gatt.connect(),
        GATT_CONNECT_TIMEOUT,
        "Превышено время ожидания ответа от устройства (таймаут GATT).",
      );

      signal?.throwIfAborted();

      selectedDevice.addEventListener(
        "gattserverdisconnected",
        this.handleGattDisconnect,
      );

      const read = createCharReader(async (svc, chr) => {
        const service = await gatt.getPrimaryService(svc);
        const characteristic = await service.getCharacteristic(chr);
        return await characteristic.readValue();
      });

      const { deviceName, deviceInfo, batteryLevel } =
        await readInitialMetadata(
          read,
          () => this.getBatteryLevel(),
          selectedDevice.name ?? null,
          signal,
        );

      return {
        device: {
          id: selectedDevice.id,
          name: deviceName,
        },
        deviceInfo,
        batteryLevel,
      };
    });
  };

  /** Чтение уровня заряда батареи (Battery Service 0x180F, характеристика 0x2A19). */
  getBatteryLevel = async (): Promise<number | null> => {
    const gatt = this.device?.gatt;
    if (!gatt?.connected) {
      logsM.warn(
        `${LOG_PREFIX} Чтение батареи отклонено: GATT-сервер не подключён.`,
      );
      return null;
    }

    logsM.info(`${LOG_PREFIX} Чтение уровня заряда батареи...`);

    try {
      const service = await gatt.getPrimaryService(BATTERY.SERVICE);
      const characteristic = await service.getCharacteristic(BATTERY.LEVEL);
      const level = (await characteristic.readValue()).getUint8(0);
      logsM.info(`${LOG_PREFIX} Заряд батареи: ${level}%`);
      return level;
    } catch (err) {
      logsM.warn(
        `${LOG_PREFIX} Ошибка чтения заряда: ${getErrorMessage(err, "неизвестная")}`,
      );
      return null;
    }
  };

  /**
   * Снять слушатели/обнулить ссылки ПЕРЕД физическим disconnect (хук базового класса).
   */
  protected override readonly beforeDisconnect = () => {
    if (!this.device) return;
    this.device.removeEventListener(
      "gattserverdisconnected",
      this.handleGattDisconnect,
    );
  };

  /** Физический разрыв: просим GATT-сервер отключиться, затем обнуляем ссылку. */
  protected doDisconnect = () => {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
  };

  /**
   * Системное событие разрыва GATT (gattserverdisconnected). Транслируется в
   * notifyDisconnected() базового класса, который вызовет onDisconnect-колбэк стора.
   */
  private readonly handleGattDisconnect = () => {
    logsM.warn(`${LOG_PREFIX} Системное событие gattserverdisconnected.`);
    this.notifyDisconnected();
  };
}
