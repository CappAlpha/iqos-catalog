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
import {
  BATTERY_REFRESH_ERROR_MESSAGE,
  CONNECT_ERROR_FALLBACK_MESSAGE,
  CONNECTION_LOST_MESSAGE,
  CONNECT_TIMEOUT_MESSAGE,
  DEVICE_NOT_SELECTED_ERROR,
  DISCONNECT_TIMEOUT_MESSAGE,
  UNSUPPORTED_MESSAGE,
  USB_CONFIG,
  USB_CONNECT_TIMEOUT_MS,
  USB_DISCONNECT_TIMEOUT_MS,
} from "./constants";
import type {
  IUsbStrategy,
  IUsbConnectionResult,
  IUsbDeviceInfo,
  TUsbStatus,
} from "./types";

const LOG_PREFIX = "[USB]";

export class UsbM {
  device: IUsbDeviceInfo | null = null;
  status: TUsbStatus = "disconnected";
  error: string | null = null;
  batteryAvailable = false;
  batteryLevel: number | null = null;
  isRefreshingBattery = false;

  readonly #getStrategy: () => Promise<IUsbStrategy>;
  readonly #logsM: IAppLogger;

  #strategy: IUsbStrategy | null = null;
  #currentConnectionId = 0;

  constructor(getStrategy: () => Promise<IUsbStrategy>, logsM: IAppLogger) {
    this.#getStrategy = getStrategy;
    this.#logsM = logsM;
    makeAutoObservable(this, { device: observable.ref });
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

  readonly #isStale = (connectionId: number): boolean =>
    connectionId !== this.#currentConnectionId;

  private readonly isCancelled = (err: unknown): boolean => {
    const message = getErrorMessage(err, "");

    return (
      message === DEVICE_NOT_SELECTED_ERROR ||
      (err instanceof DOMException &&
        (err.name === "NotFoundError" || err.name === "AbortError"))
    );
  };

  connect = async () => {
    if (this.isConnecting || this.isDisconnecting) {
      this.#logsM.warn(
        `${LOG_PREFIX} Повторное подключение отклонено. Статус: ${this.status}`,
      );
      return;
    }

    if (!this.isSupported) {
      this.#logsM.warn(`${LOG_PREFIX} ${UNSUPPORTED_MESSAGE}`);
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

      if (this.#isStale(connectionId)) {
        await strategy.disconnect();
        return;
      }

      this.#strategy = strategy;

      const result = await actionPromiseWithTimeout(
        strategy.connect(USB_CONFIG, this.handleDisconnect),
        USB_CONNECT_TIMEOUT_MS,
        CONNECT_TIMEOUT_MESSAGE,
      );

      if (this.#isStale(connectionId)) {
        await strategy.disconnect().catch((error) => {
          this.#logsM.error(
            `${LOG_PREFIX} Ошибка при освобождении ресурсов`,
            error,
          );
        });
        return;
      }

      runInAction(() => this.setConnected(result));
    } catch (err) {
      if (this.#isStale(connectionId)) return;

      await strategy?.disconnect().catch((error) => {
        this.#logsM.error(
          `${LOG_PREFIX} Ошибка при принудительном отключении`,
          error,
        );
      });

      runInAction(() =>
        this.reset(
          this.isCancelled(err)
            ? null
            : getErrorMessage(err, CONNECT_ERROR_FALLBACK_MESSAGE),
        ),
      );
    }
  };

  private readonly handleDisconnect = () => {
    this.#currentConnectionId++;
    this.reset(this.isDisconnecting ? null : CONNECTION_LOST_MESSAGE);
  };

  disconnect = async () => {
    if (this.isDisconnecting || (!this.isConnected && !this.isConnecting))
      return;

    runInAction(() => {
      this.status = "disconnecting";
      this.error = null;
    });

    this.#currentConnectionId++;

    try {
      await actionPromiseWithTimeout(
        this.#strategy?.disconnect() ?? Promise.resolve(),
        USB_DISCONNECT_TIMEOUT_MS,
        DISCONNECT_TIMEOUT_MESSAGE,
      );
    } catch (err) {
      this.#logsM.error(
        `${LOG_PREFIX} Физическое отключение не завершилось штатно`,
        err,
      );
    } finally {
      runInAction(() => this.reset(null));
    }
  };

  refreshBattery = async () => {
    if (!this.isConnected || !this.batteryAvailable || this.isRefreshingBattery)
      return;

    const connectionId = this.#currentConnectionId;
    this.isRefreshingBattery = true;
    try {
      const battery = await this.#strategy?.getBatteryLevel();

      if (!this.isConnected || this.#isStale(connectionId)) return;

      runInAction(() => {
        if (battery == null) this.batteryAvailable = false;
        this.batteryLevel = battery ?? null;
      });
    } catch (err) {
      if (!this.isConnected || this.#isStale(connectionId)) return;

      runInAction(() => {
        this.error = getErrorMessage(err, BATTERY_REFRESH_ERROR_MESSAGE);
      });
    } finally {
      runInAction(() => {
        this.isRefreshingBattery = false;
      });
    }
  };
}

export const usbM = new UsbM(getUsbStrategy, logsM);
