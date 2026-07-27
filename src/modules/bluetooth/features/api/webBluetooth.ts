import { logsM } from "@/modules/logs/features/model/logsM";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { createCharReader } from "../lib/readCharacteristic";
import { getEmptyDeviceInfo } from "../lib/readDeviceInfo";
import { readInitialMetadata } from "../lib/readInitialMetadata";
import { BATTERY } from "../model/constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

export class WebBluetooth implements IBluetoothStrategy {
  private device: BluetoothDevice | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  connect = async (
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
    signal?: AbortSignal,
  ): Promise<IBluetoothConnectionResult> => {
    this.cleanup();

    try {
      const selectedDevice: BluetoothDevice =
        await navigator.bluetooth.requestDevice({
          // TODO: remove comment and acceptAllDevices on release
          // filters: [{ services: config.services }],
          acceptAllDevices: true,
          optionalServices: [BATTERY.SERVICE, ...config.services],
        });

      signal?.throwIfAborted();

      const gatt = selectedDevice.gatt;
      if (!gatt) {
        logsM.warn(
          `[WebBluetooth] У выбранного устройства "${selectedDevice.name}" отсутствует GATT-сервер.`,
        );
        return {
          device: { id: selectedDevice.id, name: selectedDevice.name ?? null },
          deviceInfo: getEmptyDeviceInfo(),
          batteryLevel: null,
        };
      }

      this.device = selectedDevice;
      this.onDisconnectCallback = onDisconnect;

      await actionPromiseWithTimeout(
        gatt.connect(),
        10000,
        "Превышено время ожидания ответа от устройства (таймаут GATT).",
      );

      signal?.throwIfAborted();

      this.device.addEventListener(
        "gattserverdisconnected",
        this.handleDisconnect,
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
    } catch (err) {
      this.cleanup();
      throw err;
    }
  };

  disconnect = () => {
    logsM.info("[WebBluetooth] Вызван ручной метод disconnect.");
    this.cleanup();
    return Promise.resolve();
  };

  getBatteryLevel = async () => {
    const gatt = this.device?.gatt;
    if (!gatt?.connected) {
      logsM.warn(
        "[WebBluetooth] Запрос чтения батареи отклонен: GATT-сервер не подключен.",
      );
      return null;
    }

    try {
      logsM.info("[WebBluetooth] Чтение уровня заряда батареи...");
      const service = await gatt.getPrimaryService(BATTERY.SERVICE);
      const characteristic = await service.getCharacteristic(BATTERY.LEVEL);
      const value = await characteristic.readValue();
      const level = value.getUint8(0);

      logsM.info(`[WebBluetooth] Прочитано значение батареи: ${level}%`);
      return level;
    } catch (err) {
      const errMsg = getErrorMessage(
        err,
        "[WebBluetooth] Ошибка при чтении уровня заряда батареи.",
      );
      logsM.warn(
        `[WebBluetooth] Ошибка при чтении уровня заряда батареи. Причина: ${errMsg}`,
      );
      return null;
    }
  };

  private readonly handleDisconnect = () => {
    logsM.warn(
      "[WebBluetooth] Сработало системное событие отключения GATT-сервера (gattserverdisconnected).",
    );
    const callback = this.onDisconnectCallback;
    this.cleanup();
    callback?.();
  };

  private readonly cleanup = () => {
    this.onDisconnectCallback = null;

    if (this.device) {
      logsM.info(
        "[WebBluetooth] Освобождение системных ресурсов и удаление обработчиков...",
      );
      logsM.info(
        `[WebBluetooth] Удаление слушателя 'gattserverdisconnected' для "${this.device.name ?? "Без имени"}"`,
      );
      this.device.removeEventListener(
        "gattserverdisconnected",
        this.handleDisconnect,
      );

      if (this.device.gatt?.connected) {
        logsM.info(
          "[WebBluetooth] Отправка запроса на отключение GATT-сервера (gatt.disconnect)...",
        );
        this.device.gatt.disconnect();
        logsM.info(
          "[WebBluetooth] Запрос gatt.disconnect() выполнен. Физическое закрытие радиоканала BLE контролируется браузером и операционной системой (может занять до 15 секунд).",
        );
      }
      this.device = null;
    } else {
      logsM.info(
        "[WebBluetooth] Очистка локальных ссылок (соединение не было установлено).",
      );
    }

    logsM.info("[WebBluetooth] Очистка ресурсов WebBluetooth завершена.");
  };
}
