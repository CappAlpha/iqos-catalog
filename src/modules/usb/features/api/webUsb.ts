import {
  DEFAULT_CONFIGURATION,
  DEFAULT_INTERFACE,
  CUSTOM_BATTERY_REQUEST,
  BATTERY_RESPONSE_LENGTH,
} from "../model/constants";
import type {
  IUsbStrategy,
  IUsbConnectionResult,
  IUsbDeviceConfig,
} from "../model/types";

const configureWebUsbDevice = async (device: USBDevice) => {
  await device.open();
  try {
    if (
      device.configuration === null ||
      device.configuration.configurationValue !== DEFAULT_CONFIGURATION
    ) {
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
      "Интерфейс занят ОС или заблокирован браузером. Продолжаем в режиме чтения метаданных.",
      err,
    );
  }
};

export class WebUsb implements IUsbStrategy {
  private device: USBDevice | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  connect = async (
    config: IUsbDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IUsbConnectionResult> => {
    if (typeof navigator === "undefined" || !navigator.usb) {
      throw new Error("WebUSB не поддерживается вашим браузером.");
    }

    const selectedDevice = await navigator.usb.requestDevice({
      filters: [config],
    });

    await configureWebUsbDevice(selectedDevice);
    this.device = selectedDevice;

    this.onDisconnectCallback = onDisconnect;
    navigator.usb.addEventListener("disconnect", this.handleDisconnect);

    const batteryLevel = await this.getBatteryLevel();

    return {
      device: selectedDevice,
      batteryLevel,
    };
  };

  disconnect = async () => {
    if (this.device) {
      await this.device.close().catch((err) => {
        console.warn("Предупреждение при закрытии WebUSB устройства:", err);
      });
    }
    this.cleanup();
  };

  getBatteryLevel = async () => {
    if (!this.device) return null;

    try {
      const result = await this.device.controlTransferIn(
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

  private readonly cleanup = () => {
    navigator.usb.removeEventListener("disconnect", this.handleDisconnect);
    this.device = null;
    this.onDisconnectCallback = null;
  };

  private readonly handleDisconnect = (event: USBConnectionEvent) => {
    if (this.device && event.device === this.device) {
      const callback = this.onDisconnectCallback;
      this.cleanup();
      callback?.();
    }
  };
}
