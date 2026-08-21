import { makeAutoObservable, observable, runInAction } from "mobx";

import {
  IS_ANDROID,
  IS_CAPACITOR,
  IS_NATIVE_USB_AVAILABLE,
  IS_WEB_USB_SUPPORTED,
} from "@/shared/config/platform";
import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";
import { logsM, type IAppLogger } from "@/shared/lib/logger";

import { getUsbStrategy } from "../lib/getUsbStrategy";
import { UNSUPPORTED_MESSAGE, USB_CONFIG } from "./constants";
import type {
  IUsbStrategy,
  IUsbDeviceConfig,
  IUsbConnectionResult,
  IUsbDeviceInfo,
} from "./types";

type TUsbStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

export class UsbM {
  device: IUsbDeviceInfo | null = null;
  status: TUsbStatus = "disconnected";
  error: string | null = null;
  batteryAvailable = false;
  batteryLevel: number | null = null;
  isRefreshingBattery = false;
  readonly deviceConfig: IUsbDeviceConfig = {
    vendorId: USB_CONFIG.VENDOR_ID,
    productId: USB_CONFIG.PRODUCT_ID,
  };

  readonly #getStrategy: () => Promise<IUsbStrategy>;
  readonly #logsM: IAppLogger;

  #strategy: IUsbStrategy | null = null;
  #currentConnectionId = 0;

  constructor(getStrategy: () => Promise<IUsbStrategy>, logsM: IAppLogger) {
    this.#getStrategy = getStrategy;
    this.#logsM = logsM;
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
      : IS_WEB_USB_SUPPORTED;
  }

  private readonly setConnected = ({
    device,
    batteryAvailable,
    batteryLevel,
  }: IUsbConnectionResult) => {
    this.status = "connected";
    this.error = null;
    this.device = device;
    this.batteryAvailable = batteryAvailable;
    this.batteryLevel = batteryLevel;
  };

  private readonly reset = (error: string | null = null) => {
    this.device = null;
    this.status = "disconnected";
    this.error = error;
    this.batteryAvailable = false;
    this.batteryLevel = null;
  };

  connect = async () => {
    if (this.isConnecting || this.isDisconnecting) {
      this.#logsM.warn(
        `[USB] Повторное подключение отклонено. Статус: ${this.status}`,
      );
      return;
    }

    if (!this.isSupported) {
      runInAction(() => this.reset(UNSUPPORTED_MESSAGE));
      this.#logsM.warn(`[USB] ${UNSUPPORTED_MESSAGE}`);
      return;
    }

    this.#currentConnectionId++;
    const connectionId = this.#currentConnectionId;

    runInAction(() => {
      this.status = "connecting";
      this.error = null;
      this.batteryAvailable = false;
      this.batteryLevel = null;
    });

    let strategy: IUsbStrategy | null = null;

    try {
      strategy = await this.#getStrategy();

      if (connectionId !== this.#currentConnectionId) {
        await strategy.disconnect();
        return;
      }

      this.#strategy = strategy;

      const result = await actionPromiseWithTimeout(
        strategy.connect(this.deviceConfig, this.handleDisconnect),
        20000,
        "Подключения по USB не удалось, попробуйте ещё раз.",
      );

      if (connectionId !== this.#currentConnectionId) {
        await strategy.disconnect().catch((error) => {
          this.#logsM.error("[USB] Ошибка при освобождении ресурсов", error);
        });
        return;
      }

      runInAction(() => this.setConnected(result));
    } catch (err) {
      if (connectionId !== this.#currentConnectionId) return;

      await strategy?.disconnect().catch((error) => {
        this.#logsM.error("[USB] Ошибка при принудительном отключении", error);
      });

      let errMsg = getErrorMessage(err, "Ошибка подключения по USB.");

      if (
        errMsg ===
        "Failed to execute 'requestDevice' on 'USB': No device selected."
      ) {
        errMsg = "Вы отменили выбор устройства.";
      }

      runInAction(() => this.reset(errMsg));
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
      this.#logsM.error(
        "[USB] Физическое отключение не завершилось штатно",
        err,
      );
    } finally {
      runInAction(() =>
        this.reset(wasConnecting ? "Подключение отменено." : null),
      );
    }
  };

  refreshBattery = async () => {
    if (!this.isConnected || !this.batteryAvailable || this.isRefreshingBattery)
      return;

    const connectionId = this.#currentConnectionId;
    this.isRefreshingBattery = true;
    try {
      const battery = await this.#strategy?.getBatteryLevel();

      if (!this.isConnected || connectionId !== this.#currentConnectionId)
        return;

      runInAction(() => {
        if (battery == null) this.batteryAvailable = false;
        this.batteryLevel = battery ?? null;
      });
    } catch (err) {
      if (!this.isConnected || connectionId !== this.#currentConnectionId)
        return;

      runInAction(() => {
        this.error = getErrorMessage(err, "Не удалось обновить заряд батареи.");
      });
    } finally {
      runInAction(() => {
        this.isRefreshingBattery = false;
      });
    }
  };
}

export const usbM = new UsbM(getUsbStrategy, logsM);
