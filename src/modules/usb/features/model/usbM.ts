import { makeAutoObservable, observable } from "mobx";

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

  private readonly updateState = (
    status: UsbStatus,
    device: Partial<USBDevice> | null = null,
    error: string | null = null,
    batteryLevel: number | null = null,
  ) => {
    this.status = status;
    this.device = device;
    this.error = error;
    this.batteryLevel = status === "connected" ? batteryLevel : null;
  };

  connect = async () => {
    if (this.status === "connecting" || this.status === "disconnecting") {
      return;
    }

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    this.updateState("connecting");

    try {
      const result = await this.#strategy.connect(
        this.deviceConfig,
        this.handleDisconnect,
      );

      if (connectionId !== this.#currentConnectionId) {
        await this.#strategy.disconnect().catch(() => {});
        return;
      }

      this.updateState("connected", result.device, null, result.batteryLevel);
    } catch (err) {
      if (connectionId !== this.#currentConnectionId) return;

      await this.#strategy.disconnect().catch(() => {});

      const errMsg = getErrorMessage(err, "Ошибка подключения по USB");
      this.updateState("disconnected", null, errMsg);
    }
  };

  disconnect = async () => {
    if (this.isDisconnecting || (!this.isConnected && !this.isConnecting))
      return;

    const wasConnecting = this.isConnecting;
    this.updateState("disconnecting");

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
      this.updateState(
        "disconnected",
        null,
        wasConnecting ? "Подключение отменено" : null,
      );
    }
  };

  getBatteryLevel = async () => {
    if (!this.isConnected) return null;

    try {
      const battery = await this.#strategy.getBatteryLevel();
      this.batteryLevel = battery;
      return battery;
    } catch (err) {
      if (!this.isConnected) return null;

      this.updateState(
        this.status,
        this.device,
        getErrorMessage(err, "Не удалось обновить заряд батареи USB"),
        this.batteryLevel,
      );
    }

    return null;
  };

  private readonly handleDisconnect = () => {
    this.updateState(
      "disconnected",
      null,
      "Устройство было физически извлечено из USB-порта.",
    );
  };
}

export const usbM = new UsbM(getUsbStrategy);
