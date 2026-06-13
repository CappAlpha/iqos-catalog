import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import type {
  IUsbStrategy,
  IUsbConnectionResult,
  IUsbDeviceConfig,
} from "../model/types";

export class AndroidNativeUsb implements IUsbStrategy {
  private get bridge() {
    return getAndroidBridge();
  }

  connect = (
    config: IUsbDeviceConfig,
    onDisconnect?: () => void,
  ): Promise<IUsbConnectionResult> => {
    const android = this.bridge;

    if (!android?.connectUsbDevice) {
      return Promise.reject(new Error("Нативный USB мост недоступен."));
    }

    if (config.vendorId === undefined || config.productId === undefined) {
      return Promise.reject(
        new Error("Неверная конфигурация: отсутствуют vendorId или productId."),
      );
    }

    try {
      android.connectUsbDevice(config.vendorId, config.productId);

      globalThis.onAndroidUsbDisconnect = onDisconnect
        ? () => {
            globalThis.onAndroidUsbDisconnect = null;
            onDisconnect();
          }
        : null;

      return Promise.resolve({
        device: null,
        batteryLevel: android.getBatteryLevel?.() ?? null,
      });
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Не удалось подключиться к устройству по USB.",
      );
      return Promise.reject(new Error(message));
    }
  };

  disconnect = () => {
    try {
      globalThis.onAndroidUsbDisconnect = null;

      this.bridge?.disconnect?.();
      return Promise.resolve();
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Не удалось отключить USB устройство.",
      );
      return Promise.reject(new Error(message));
    }
  };

  getBatteryLevel = () => {
    try {
      const battery = this.bridge?.getBatteryLevel?.() ?? null;
      return Promise.resolve(battery);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Не удалось получить уровень заряда USB устройства.",
      );
      return Promise.reject(new Error(message));
    }
  };
}
