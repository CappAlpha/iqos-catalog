import { UsbSerial } from "capacitor-usb-serial";

import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import type {
  IUsbStrategy,
  IUsbConnectionResult,
  IUsbDeviceConfig,
} from "../model/types";

export class AndroidNativeUsb implements IUsbStrategy {
  private activePortKey: string | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private isDisconnecting = false;

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

    try {
      const { devices } = await UsbSerial.getDeviceConnections();

      const targetDevice = devices.find(
        (d) => d.vendorId === vendorId && d.productId === productId,
      );

      if (!targetDevice) {
        throw new Error("Не удалось подключиться к устройству по USB.");
      }

      const connection = await UsbSerial.openConnection({
        deviceId: targetDevice.deviceId,
      });

      this.activePortKey = connection.portKey;
      this.onDisconnectCallback = onDisconnect;

      return {
        device: {
          vendorId,
          productId,
          productName: targetDevice.deviceName ?? "USB устройство",
          manufacturerName: "Generic USB Device",
        },
        batteryLevel: null,
      };
    } catch (error) {
      await this.cleanup(false);
      const message = getErrorMessage(
        error,
        "Не удалось подключиться к устройству по USB.",
      );
      throw new Error(message, { cause: error });
    }
  };

  disconnect = async () => {
    await this.cleanup(true);
  };

  getBatteryLevel = (): Promise<number | null> => {
    return Promise.resolve(null);
  };

  private readonly cleanup = async (isPhysicalDisconnect = false) => {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;

    const callback = this.onDisconnectCallback;
    const portKeyToClose = this.activePortKey;

    const wasConnected = !!portKeyToClose;

    this.activePortKey = null;
    this.onDisconnectCallback = null;

    if (portKeyToClose) {
      try {
        await UsbSerial.endConnection({ key: portKeyToClose });
      } catch (e) {
        console.warn("Ошибка при закрытии USB порта:", e);
      }
    } else {
      try {
        await UsbSerial.endConnections();
      } catch (e) {
        console.warn("Ошибка при закрытии USB соединений:", e);
      }
    }

    this.isDisconnecting = false;

    if (isPhysicalDisconnect && wasConnected) {
      callback?.();
    }
  };
}
