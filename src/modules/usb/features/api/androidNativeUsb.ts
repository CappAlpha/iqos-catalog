import type { PluginListenerHandle } from "@capacitor/core";
import { UsbSerial } from "capacitor-usb-serial";

import { AndroidBridge } from "@/shared/lib/getAndroidBridge";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import type {
  IUsbStrategy,
  IUsbConnectionResult,
  IUsbDeviceConfig,
} from "../model/types";

interface CapacitorPluginWithEvents {
  addListener(
    eventName: string,
    listenerFunc: (...args: unknown[]) => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

export class AndroidNativeUsb implements IUsbStrategy {
  private activePortKey: string | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private disconnectListener: PluginListenerHandle | null = null;

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

      this.setupDisconnectListener();

      const batteryLevel = await this.getBatteryLevel();

      return {
        device: {
          vendorId,
          productId,
          productName: targetDevice.deviceName ?? "USB устройство",
          manufacturerName: "Generic USB Device",
          opened: true,
        },
        batteryLevel,
      };
    } catch (error) {
      await this.cleanup();
      const message = getErrorMessage(
        error,
        "Не удалось подключиться к устройству по USB через плагин.",
      );
      throw new Error(message, { cause: error });
    }
  };

  disconnect = async () => {
    await this.cleanup();
  };

  getBatteryLevel = async (): Promise<number | null> => {
    try {
      if (AndroidBridge?.getBatteryLevel) {
        const batteryRes = await AndroidBridge.getBatteryLevel();
        return batteryRes?.level ?? null;
      }
      return null;
    } catch (error) {
      console.warn("Не удалось получить уровень заряда USB устройства:", error);
      return null;
    }
  };

  private readonly setupDisconnectListener = () => {
    void this.cleanup();

    if (AndroidBridge && "addListener" in AndroidBridge) {
      try {
        const bridgeWithEvents =
          AndroidBridge as unknown as CapacitorPluginWithEvents;

        this.disconnectListener = bridgeWithEvents.addListener(
          "usbDisconnect",
          () => {
            void this.handleDisconnect();
          },
        );
      } catch (e) {
        console.warn("Не удалось добавить Capacitor listener:", e);
      }
    }
  };

  private readonly handleDisconnect = async () => {
    const callback = this.onDisconnectCallback;
    await this.cleanup();
    callback?.();
  };

  private readonly cleanup = async () => {
    if (this.disconnectListener) {
      try {
        await this.disconnectListener.remove();
      } catch (e) {
        console.warn("Ошибка при удалении Capacitor listener:", e);
      }
      this.disconnectListener = null;
    }

    if (this.activePortKey) {
      try {
        await UsbSerial.endConnection({ key: this.activePortKey });
      } catch (e) {
        console.warn("Ошибка при закрытии USB порта:", e);
      }
      this.activePortKey = null;
    } else {
      await UsbSerial.endConnections().catch((e) => {
        console.warn("Ошибка при закрытии USB соединений:", e);
      });
    }

    this.onDisconnectCallback = null;
  };
}
