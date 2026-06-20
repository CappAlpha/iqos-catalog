import { makeAutoObservable, observable } from "mobx";

import {
  IS_ANDROID,
  IS_CAPACITOR,
  IS_PLUGIN_AVAILABLE_USB,
  IS_WEB_SUPPORTED,
} from "@/shared/constants/constants";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { getUsbStrategy } from "../lib/getUsbStrategy";
import { USB_CONFIG } from "./constants";
import type { IUsbStrategy, IUsbDeviceConfig } from "./types";

type UsbStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

class UsbM {
  device: Partial<USBDevice> | null = null;
  status: UsbStatus = "disconnected";
  error: string | null = null;
  batteryLevel: number | null = null;
  deviceConfig: IUsbDeviceConfig = {
    vendorId: USB_CONFIG.VENDOR_ID,
    productId: USB_CONFIG.PRODUCT_ID,
  };

  readonly #strategy: IUsbStrategy;
  #currentConnectionId = 0;

  constructor(getStrategy: () => IUsbStrategy) {
    this.#strategy = getStrategy();
    makeAutoObservable(this, {
      device: observable.ref,
    });
  }

  get isConnected() {
    return this.status === "connected";
  }
  get isConnecting() {
    return this.status === "connecting";
  }
  get isDisconnecting() {
    return this.status === "disconnecting";
  }

  get isSupported() {
    if (IS_CAPACITOR) {
      return IS_ANDROID && IS_PLUGIN_AVAILABLE_USB;
    }

    return IS_WEB_SUPPORTED;
  }

  private readonly setConnected = ({
    device,
    batteryLevel,
  }: {
    device: Partial<USBDevice> | null;
    batteryLevel: number | null;
  }) => {
    this.status = "connected";
    this.error = null;
    this.device = device;
    this.batteryLevel = batteryLevel;
  };

  private readonly reset = (error: string | null = null) => {
    this.device = null;
    this.status = "disconnected";
    this.error = error;
    this.batteryLevel = null;
  };

  connect = async () => {
    if (this.status === "connecting" || this.status === "disconnecting") return;

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    this.status = "connecting";
    this.error = null;
    this.batteryLevel = null;

    try {
      const result = await actionPromiseWithTimeout(
        this.#strategy.connect(this.deviceConfig, this.handleDisconnect),
        20000,
        "Подключения по USB не удалось, попробуйте ещё раз.",
      );

      if (connectionId !== this.#currentConnectionId) {
        await this.#strategy.disconnect().catch(() => {});
        return;
      }

      this.setConnected(result);
    } catch (err) {
      if (connectionId !== this.#currentConnectionId) return;

      await this.#strategy.disconnect().catch(() => {});

      const errMsg = getErrorMessage(err, "Ошибка подключения по USB.");
      this.reset(errMsg);
    }
  };

  private readonly handleDisconnect = () => {
    this.#currentConnectionId++;
    if (this.status === "disconnecting") {
      this.reset();
    } else {
      this.reset("Устройство было физически извлечено из USB-порта.");
    }
  };

  disconnect = async () => {
    if (this.isDisconnecting || (!this.isConnected && !this.isConnecting))
      return;

    const wasConnecting = this.isConnecting;
    this.status = "disconnecting";
    this.error = null;

    this.#currentConnectionId++;

    try {
      await actionPromiseWithTimeout(
        this.#strategy.disconnect(),
        3000,
        "Таймаут физического отключения",
      );
    } catch (err) {
      console.warn("Физическое отключение USB не завершилось штатно:", err);
    } finally {
      this.reset(wasConnecting ? "Подключение отменено." : null);
    }
  };

  refreshBattery = async () => {
    if (!this.isConnected) return;

    try {
      const battery = await this.#strategy.getBatteryLevel();

      if (!this.isConnected) return;

      this.batteryLevel = battery;
    } catch (err) {
      if (!this.isConnected) return;

      this.error = getErrorMessage(
        err,
        "Не удалось обновить заряд батареи USB.",
      );
    }
  };
}

export const usbM = new UsbM(getUsbStrategy);
