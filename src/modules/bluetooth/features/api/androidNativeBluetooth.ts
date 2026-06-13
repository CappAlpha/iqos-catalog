import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

export class AndroidNativeBluetooth implements IBluetoothStrategy {
  private get bridge() {
    return getAndroidBridge();
  }

  connect = (
    config: IBluetoothDeviceConfig,
    onDisconnect?: () => void,
  ): Promise<IBluetoothConnectionResult> => {
    const android = this.bridge;

    if (!android?.connectBluetoothDevice) {
      return Promise.reject(new Error("Нативный Bluetooth мост недоступен."));
    }

    try {
      android.connectBluetoothDevice(config.services[0]);

      globalThis.onAndroidBluetoothDisconnect = onDisconnect
        ? () => {
            globalThis.onAndroidBluetoothDisconnect = null;
            onDisconnect();
          }
        : null;

      return Promise.resolve({
        device: null,
        services: config.services,
        batteryLevel: android.getBatteryLevel?.() ?? null,
      });
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Не удалось подключиться к устройству.",
      );
      return Promise.reject(new Error(message));
    }
  };

  disconnect = () => {
    try {
      globalThis.onAndroidBluetoothDisconnect = null;

      this.bridge?.disconnect?.();
      return Promise.resolve();
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Не удалось отключить устройство.",
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
        "Не удалось получить уровень заряда устройства.",
      );
      return Promise.reject(new Error(message));
    }
  };
}
