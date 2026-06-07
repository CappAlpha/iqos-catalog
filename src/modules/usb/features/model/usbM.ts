import { makeAutoObservable, observable } from "mobx";

import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import {
  DEFAULT_CONFIGURATION,
  DEFAULT_INTERFACE,
  ANDROID_USB_CONFIG,
  CUSTOM_BATTERY_REQUEST,
  BATTERY_RESPONSE_LENGTH,
} from "./constants";

type UsbStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

const configureWebUsbDevice = async (device: USBDevice) => {
  await device.open();
  try {
    if (device.configuration === null) {
      await device.selectConfiguration(DEFAULT_CONFIGURATION);
    }
  } catch (err) {
    await device.close().catch(() => {});
    throw err;
  }

  try {
    await device.claimInterface(DEFAULT_INTERFACE);
  } catch (err) {
    console.warn(
      "Интерфейс занят ОС или заблокирован браузером. Продолжаем в режиме чтения метаданных (порт закрыт для безопасности).",
      err,
    );
    await device.close().catch(() => {});
  }
};

class UsbM {
  device: USBDevice | null = null;
  deviceName: string | null = null;
  status: UsbStatus = "disconnected";
  error: string | null = null;
  batteryLevel: number | null = null;

  private get bridge() {
    return getAndroidBridge();
  }

  constructor() {
    makeAutoObservable(this, {
      device: observable.ref,
    });

    if (typeof navigator !== "undefined" && navigator.usb) {
      navigator.usb.addEventListener(
        "disconnect",
        this.handlePhysicalDisconnect,
      );
    }
  }

  get isDisconnected() {
    return this.status === "disconnected";
  }
  get isConnecting() {
    return this.status === "connecting";
  }
  get isConnected() {
    return this.status === "connected";
  }
  get isDisconnecting() {
    return this.status === "disconnecting";
  }

  private readonly updateState = (
    status: UsbStatus,
    device: USBDevice | null = null,
    error: string | null = null,
    batteryLevel: number | null = null,
  ) => {
    this.status = status;
    this.device = device;
    this.error = error;
    this.deviceName =
      status === "connected"
        ? (device?.productName ?? device?.manufacturerName ?? "USB Устройство")
        : null;
    this.batteryLevel = status === "connected" ? batteryLevel : null;
  };

  setBatteryLevel = (battery: number | null) => {
    this.batteryLevel = battery;
  };

  connect = async () => {
    this.status = "connecting";
    this.error = null;

    try {
      const android = this.bridge;

      if (android?.connectUsbDevice) {
        android.connectUsbDevice(
          ANDROID_USB_CONFIG.VENDOR_ID,
          ANDROID_USB_CONFIG.PRODUCT_ID,
        );
        const battery = android.getBatteryLevel?.() ?? null;
        this.updateState("connected", null, null, battery);
        return;
      }

      if (!navigator.usb) {
        throw new Error("WebUSB не поддерживается вашим браузером.");
      }

      // TODO: remove for test
      const selectedDevice = await navigator.usb.requestDevice({
        filters: [
          {
            // vendorId: ANDROID_USB_CONFIG.VENDOR_ID,
            // productId: ANDROID_USB_CONFIG.PRODUCT_ID
          },
        ],
      });

      await configureWebUsbDevice(selectedDevice);

      this.updateState("connected", selectedDevice);

      await this.getBatteryLevel();
    } catch (err) {
      this.updateState(
        "disconnected",
        null,
        getErrorMessage(err, "Ошибка подключения по USB"),
      );
    }
  };

  disconnect = async () => {
    if (!this.isConnected) return;

    this.status = "disconnecting";
    this.error = null;

    try {
      const android = this.bridge;

      if (android?.disconnect) {
        android.disconnect();
      } else {
        await this.device?.close().catch((err) => {
          console.warn("Предупреждение при закрытии WebUSB устройства:", err);
        });
      }
    } catch (err) {
      console.error("Непредвиденная ошибка при отключении:", err);
    } finally {
      this.updateState("disconnected");
    }
  };

  getBatteryLevel = async () => {
    if (!this.isConnected) return null;

    try {
      const android = this.bridge;
      let battery: number | null = null;

      if (android?.getBatteryLevel) {
        battery = android.getBatteryLevel() ?? null;
      } else if (
        this.device &&
        this.device.vendorId === ANDROID_USB_CONFIG.VENDOR_ID
      ) {
        battery = await this.readCustomDeviceBattery(this.device);
      }

      this.setBatteryLevel(battery);
      return battery;
    } catch (err) {
      console.warn("Не удалось получить уровень заряда батареи по USB:", err);
    }

    return null;
  };

  private readonly readCustomDeviceBattery = async (
    device: USBDevice,
  ): Promise<number | null> => {
    try {
      const result = await device.controlTransferIn(
        CUSTOM_BATTERY_REQUEST,
        BATTERY_RESPONSE_LENGTH,
      );

      if (result.status === "ok" && result.data && result.data.byteLength > 0) {
        return result.data.getUint8(0);
      }
    } catch (error) {
      console.warn(
        "Ошибка при низкоуровневом чтении заряда устройства:",
        error,
      );
    }
    return null;
  };

  private readonly handlePhysicalDisconnect = (event: USBConnectionEvent) => {
    if (this.device && event.device === this.device) {
      this.updateState(
        "disconnected",
        null,
        "Устройство было физически извлечено из USB-порта.",
      );
    }
  };
}

export const usbM = new UsbM();
