import { makeAutoObservable, observable, runInAction } from "mobx";

import {
  IS_ANDROID,
  IS_CAPACITOR,
  IS_NATIVE_USB_AVAILABLE,
  IS_WEB_SUPPORTED,
} from "@/shared/config/platform";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { getUsbStrategy } from "../lib/getUsbStrategy";
import { USB_CONFIG } from "./constants";
import type {
  IUsbStrategy,
  IUsbDeviceConfig,
  IUsbConnectionResult,
  IUsbDeviceInfo,
} from "./types";

type UsbStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

class UsbM {
  device: IUsbDeviceInfo | null = null;
  status: UsbStatus = "disconnected";
  error: string | null = null;
  batteryLevel: number | null = null;
  readonly deviceConfig: IUsbDeviceConfig = {
    vendorId: USB_CONFIG.VENDOR_ID,
    productId: USB_CONFIG.PRODUCT_ID,
  };

  readonly #getStrategy: () => Promise<IUsbStrategy>;

  #strategy: IUsbStrategy | null = null;
  #currentConnectionId = 0;

  constructor(getStrategy: () => Promise<IUsbStrategy>) {
    this.#getStrategy = getStrategy;
    makeAutoObservable(this, {
      device: observable.ref,
      deviceConfig: false,
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
    return IS_CAPACITOR && IS_ANDROID
      ? IS_NATIVE_USB_AVAILABLE
      : IS_WEB_SUPPORTED;
  }

  private readonly setConnected = ({
    device,
    batteryLevel,
  }: IUsbConnectionResult) => {
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
    if (this.isConnecting || this.isDisconnecting) return;

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    runInAction(() => {
      this.status = "connecting";
      this.error = null;
      this.batteryLevel = null;
    });

    try {
      this.#strategy ??= await this.#getStrategy();

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

      await this.#strategy?.disconnect().catch(() => {});

      const errMsg = getErrorMessage(err, "Ошибка подключения по USB.");
      this.reset(errMsg);
    }
  };

  private readonly handleDisconnect = () => {
    this.#currentConnectionId++;

    if (this.isDisconnecting) {
      this.reset();
    } else {
      this.reset(
        "Соединение разорвано: устройство отключено или извлечено из USB-порта.",
      );
    }
  };

  disconnect = async () => {
    if (this.isDisconnecting || (!this.isConnected && !this.isConnecting))
      return;

    const wasConnecting = this.isConnecting;

    runInAction(() => {
      this.status = "disconnecting";
      this.error = null;
    });

    this.#currentConnectionId++;

    try {
      await actionPromiseWithTimeout(
        this.#strategy?.disconnect() ?? Promise.resolve(),
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
      const battery = await this.#strategy?.getBatteryLevel();

      if (!this.isConnected) return;

      runInAction(() => {
        this.batteryLevel = battery ?? null;
      });
    } catch (err) {
      if (!this.isConnected) return;

      runInAction(() => {
        this.error = getErrorMessage(err, "Не удалось обновить заряд батареи.");
      });
    }
  };
}

export const usbM = new UsbM(getUsbStrategy);
