import type { PluginListenerHandle } from "@capacitor/core";
import { UsbSerial } from "@leeskies/capacitor-usb-serial";

import { logsM } from "@/modules/logs/features/model/logsM";
import { BaseConnectionStrategy } from "@/shared/lib/baseConnectionStrategy";

import type { IUsbConnectionResult, IUsbDeviceConfig } from "../model/types";

const LOG_PREFIX = "[NativeUSB]";

/**
 * USB-стратегия для Android через `@leeskies/capacitor-usb-serial`.
 *
 * Ищет устройство по `vendorId/productId`, запрашивает permission при
 * необходимости и открывает native USB-порт.
 */
export class AndroidNativeUsb extends BaseConnectionStrategy<
  IUsbDeviceConfig,
  IUsbConnectionResult
> {
  protected readonly logPrefix = LOG_PREFIX;
  protected readonly disconnectErrorMessage = "Ошибка при отключении USB";
  protected readonly manualDisconnectMessage = "Ручное отключение.";

  /** Создаёт стратегию native USB с общим logger приложения. */
  constructor() {
    super(logsM);
  }

  private activePortKey: string | null = null;
  private activeDeviceId: string | null = null;
  private detachListener: PluginListenerHandle | null = null;

  /**
   * Ищет и открывает подходящее Android USB-устройство.
   *
   * @param config идентификаторы производителя и продукта;
   * @param onDisconnect callback системного отключения, если транспорт его предоставляет;
   * @returns метаданные открытого USB-порта;
   * @throws если устройство не найдено, permission отклонён или порт не открылся;
   */
  connect = async (
    config: IUsbDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IUsbConnectionResult> => {
    const { vendorId, productId } = config;

    if (vendorId === undefined || productId === undefined) {
      throw new Error(
        "Неверная конфигурация: отсутствуют vendorId или productId.",
      );
    }

    logsM.info(
      `${LOG_PREFIX} Поиск устройства VID=${vendorId}, PID=${productId}.`,
    );

    return this.withDisconnectCallback(onDisconnect, async () => {
      const { devices } = await UsbSerial.listDevices();
      logsM.info(`${LOG_PREFIX} Найдено USB-устройств: ${devices.length}.`);

      const targetDevice = devices.find(
        (d) => d.vendorId === vendorId && d.productId === productId,
      );

      if (!targetDevice) {
        throw new Error("USB-устройство не найдено.");
      }

      logsM.success(
        `${LOG_PREFIX} Устройство найдено: "${targetDevice.deviceName ?? "Без имени"}" (ID: ${targetDevice.deviceId}).`,
      );

      if (!targetDevice.hasPermission) {
        logsM.info(`${LOG_PREFIX} Запрос разрешения на доступ к устройству.`);
        const { granted } = await UsbSerial.requestPermission({
          deviceId: targetDevice.deviceId,
        });
        if (!granted) throw new Error("Доступ к USB-устройству отклонён.");
        logsM.success(`${LOG_PREFIX} Доступ к USB-устройству получен.`);
      }

      const connection = await UsbSerial.open({
        deviceId: targetDevice.deviceId,
      });

      if (!this.isOperationActive()) {
        await UsbSerial.close({ portId: connection.portId }).catch(() => {});
        throw new DOMException("Подключение отменено.", "AbortError");
      }

      this.activePortKey = connection.portId;
      this.activeDeviceId = targetDevice.deviceId;
      logsM.success(`${LOG_PREFIX} USB-порт открыт: ${connection.portId}.`);
      this.detachListener = await UsbSerial.addListener(
        "detached",
        this.handleDetached,
      );
      logsM.info(`${LOG_PREFIX} Listener отключения зарегистрирован.`);

      return {
        device: {
          vendorId,
          productId,
          productName: targetDevice.deviceName ?? "USB устройство",
          manufacturerName: "Generic USB Device",
        },
        batteryAvailable: false,
        batteryLevel: null,
      };
    });
  };

  /**
   * Возвращает уровень батареи native USB-устройства.
   *
   * Текущий native USB-плагин не предоставляет чтение батареи, поэтому метод
   * сохраняет единый контракт стратегии и возвращает `null`.
   *
   * @returns всегда `null`, если native USB battery API недоступен;
   */
  getBatteryLevel = (): Promise<number | null> => {
    logsM.info(`${LOG_PREFIX} Native USB не предоставляет чтение батареи.`);
    return Promise.resolve(null);
  };

  protected override readonly doDisconnect = async () => {
    const portKeyToClose = this.activePortKey;
    this.activePortKey = null;
    this.activeDeviceId = null;

    if (portKeyToClose) {
      logsM.info(`${LOG_PREFIX} Закрытие USB-порта: ${portKeyToClose}.`);
      await UsbSerial.close({ portId: portKeyToClose });
      logsM.success(`${LOG_PREFIX} USB-порт закрыт.`);
    }
  };

  /** Снимает native USB listener перед закрытием порта. */
  protected override readonly beforeDisconnect = async () => {
    const listener = this.detachListener;
    this.detachListener = null;
    await listener?.remove();
    logsM.info(`${LOG_PREFIX} Listener отключения снят.`);
  };

  /** Передаёт detach только для текущего устройства в общий lifecycle. */
  private readonly handleDetached = (event: { deviceId: string }) => {
    if (event.deviceId === this.activeDeviceId) {
      logsM.warn(`${LOG_PREFIX} Устройство отключено системой.`);
      this.notifyDisconnected();
    }
  };
}
