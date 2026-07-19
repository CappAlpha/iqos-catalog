import { logsM } from "@/modules/logs/features/model/logsM";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { createCharReader } from "../lib/readCharacteristic";
import { readDeviceInfo, getEmptyDeviceInfo } from "../lib/readDeviceInfo";
import { GAP, BATTERY } from "../model/constants";
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
    logsM.info(
      "[WebBluetooth] Сброс предыдущего состояния перед новым подключением.",
    );
    this.cleanup();

    logsM.info(
      "[WebBluetooth] Запуск системного диалога выбора Bluetooth-устройства...",
    );
    let selectedDevice: BluetoothDevice;
    try {
      selectedDevice = await navigator.bluetooth.requestDevice({
        // TODO: remove comment and acceptAllDevices on release
        // filters: [{ services: config.services }],
        acceptAllDevices: true,
        optionalServices: [BATTERY.SERVICE, ...config.services],
      });

      if (signal?.aborted) {
        logsM.warn(
          "[WebBluetooth] Устройство выбрано, но таймаут сопряжения в сторе уже истек. Сброс.",
        );
        this.cleanup();
        throw new Error("Connection aborted by timeout");
      }

      logsM.success(
        `[WebBluetooth] Устройство успешно выбрано пользователем: "${selectedDevice.name ?? "Без имени"}" (ID: ${selectedDevice.id})`,
      );
    } catch (err) {
      logsM.error(
        "[WebBluetooth] Ошибка при выборе устройства в диалоговом окне (возможно, выбор отменен)",
        err,
      );
      throw err;
    }

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

    try {
      logsM.info(
        "[WebBluetooth] Попытка физического подключения к GATT-серверу...",
      );
      await actionPromiseWithTimeout(
        gatt.connect(),
        10000,
        "Превышено время ожидания ответа от устройства (таймаут GATT).",
      );

      if (signal?.aborted) {
        logsM.warn(
          "[WebBluetooth] Соединение установлено, но таймаут стора истек. Принудительный разрыв.",
        );
        this.cleanup();
        throw new Error("Connection aborted by timeout");
      }

      logsM.success(
        "[WebBluetooth] Физическое подключение к GATT-серверу успешно установлено.",
      );
    } catch (err) {
      logsM.error(
        "[WebBluetooth] Ошибка физического подключения к GATT-серверу",
        err,
      );
      this.cleanup();
      throw err;
    }

    this.device.addEventListener(
      "gattserverdisconnected",
      this.handleDisconnect,
    );

    const read = createCharReader(async (svc, chr) => {
      try {
        const service = await gatt.getPrimaryService(svc);
        const characteristic = await service.getCharacteristic(chr);
        return await characteristic.readValue();
      } catch (err) {
        const errMsg = getErrorMessage(
          err,
          "[WebBluetooth] Ошибка чтения характеристики.",
        );
        logsM.warn(
          `[WebBluetooth] Ошибка чтения характеристики. Service: ${svc}, Char: ${chr} [ERROR]: ${errMsg}`,
        );
        throw err;
      }
    });

    logsM.info(
      "[WebBluetooth] Запуск параллельного чтения базовых характеристик (Имя, Информация об устройстве, Батарея)...",
    );
    const [nameResult, infoResult, batteryResult] = await Promise.allSettled([
      read(GAP.SERVICE, GAP.DEVICE_NAME),
      readDeviceInfo(read),
      this.getBatteryLevel(),
    ]);

    if (signal?.aborted) {
      logsM.warn(
        "[WebBluetooth] Характеристики прочитаны, но таймаут сопряжения уже истек. Разрыв связи.",
      );
      this.cleanup();
      throw new Error("Connection aborted by timeout");
    }

    let connectedName: string | null = null;
    if (nameResult.status === "fulfilled" && nameResult.value !== null) {
      connectedName = nameResult.value;
      logsM.info(
        `[WebBluetooth] Имя устройства из GAP-сервиса успешно прочитано: "${connectedName}"`,
      );
    } else {
      const reasonStr =
        nameResult.status === "rejected"
          ? nameResult.reason instanceof Error
            ? nameResult.reason.message
            : typeof nameResult.reason === "string"
              ? nameResult.reason
              : "Неизвестная ошибка"
          : "Характеристика заблокирована браузером Chrome или отсутствует на устройстве";

      logsM.warn(
        `[WebBluetooth] Не удалось получить имя из GAP-сервиса. Причина: ${reasonStr}`,
      );
    }

    const deviceName: string | null =
      connectedName ?? selectedDevice.name ?? null;

    let deviceInfo = getEmptyDeviceInfo();
    if (
      infoResult.status === "fulfilled" &&
      infoResult.value.manufacturerName !== null
    ) {
      deviceInfo = infoResult.value;
      logsM.success(
        `[WebBluetooth] Информация об устройстве (DeviceInfo) успешно прочитана: ${JSON.stringify(deviceInfo)}`,
      );
    } else {
      const reasonStr =
        infoResult.status === "rejected"
          ? infoResult.reason instanceof Error
            ? infoResult.reason.message
            : typeof infoResult.reason === "string"
              ? infoResult.reason
              : "Неизвестная ошибка"
          : "Сервис DeviceInfo отсутствует на устройстве или заблокирован браузером";
      logsM.warn(
        `[WebBluetooth] Не удалось прочитать DeviceInfo. Причина: ${reasonStr}`,
      );
    }

    let batteryLevel: number | null = null;
    if (batteryResult.status === "fulfilled" && batteryResult.value !== null) {
      batteryLevel = batteryResult.value;
      logsM.info(
        `[WebBluetooth] Уровень заряда батареи успешно прочитан: ${batteryLevel}%`,
      );
    } else {
      const reasonStr =
        batteryResult.status === "rejected"
          ? batteryResult.reason instanceof Error
            ? batteryResult.reason.message
            : typeof batteryResult.reason === "string"
              ? batteryResult.reason
              : "Неизвестная ошибка"
          : "Сервис батареи отсутствует на устройстве или заблокирован браузером";

      logsM.warn(
        `[WebBluetooth] Не удалось получить заряд батареи на этапе сопряжения. Причина: ${reasonStr}`,
      );
    }

    logsM.success(
      `[WebBluetooth] Процесс сопряжения и инициализации завершен для "${deviceName}"`,
    );

    return {
      device: {
        id: selectedDevice.id,
        name: deviceName,
      },
      deviceInfo,
      batteryLevel,
    };
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
