// nativeBluetooth.ts
import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import type { IBluetooth, BluetoothConnectionResult } from "../model/types";

export class NativeBluetooth implements IBluetooth {
  private get bridge() {
    return getAndroidBridge();
  }

  connect = (
    targetServiceUuid: string,
    fallbackName: string,
    onDisconnect?: () => void,
  ): Promise<BluetoothConnectionResult> => {
    const android = this.bridge;

    if (!android?.connectBluetoothDevice) {
      return Promise.reject(new Error("Нативный Bluetooth мост недоступен."));
    }

    try {
      android.connectBluetoothDevice(targetServiceUuid);

      globalThis.onAndroidBluetoothDisconnect = onDisconnect ?? null;

      return Promise.resolve({
        deviceName: fallbackName,
        services: [targetServiceUuid],
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
