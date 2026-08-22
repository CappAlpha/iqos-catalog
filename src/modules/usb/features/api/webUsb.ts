import { BaseConnectionStrategy } from "@/shared/lib/baseConnectionStrategy";
import { logsM } from "@/shared/lib/logger";

import {
  DEFAULT_CONFIGURATION,
  DEFAULT_INTERFACE,
  CUSTOM_BATTERY_REQUEST,
  BATTERY_RESPONSE_LENGTH,
} from "../model/constants";
import type { IUsbConnectionResult, IUsbDeviceConfig } from "../model/types";

const LOG_PREFIX = "[WebUSB]";

/**
 * USB-стратегия для браузеров с поддержкой WebUSB.
 *
 * Открывает выбранное устройство, переключает его конфигурацию, пытается
 * захватить интерфейс и читает заряд через vendor control transfer.
 */
export class WebUsb extends BaseConnectionStrategy<
  IUsbDeviceConfig,
  IUsbConnectionResult
> {
  protected readonly logPrefix = LOG_PREFIX;
  protected readonly disconnectErrorMessage = "Ошибка при отключении USB";
  protected readonly manualDisconnectMessage = "Ручное отключение.";

  /** Создаёт стратегию WebUSB с общим logger приложения. */
  constructor() {
    super(logsM);
  }

  private device: USBDevice | null = null;
  private isInterfaceClaimed = false;
  private batteryAvailable = false;

  /**
   * Запрашивает USB-устройство и подготавливает его к обмену данными.
   *
   * @param config конфигурация USB-устройства; используется текущим сценарием
   * выбора устройства при включении production-фильтров;
   * @param onDisconnect callback физического отключения устройства;
   * @returns метаданные выбранного устройства и начальный уровень батареи;
   * @throws если браузер отменил выбор или устройство не удалось открыть;
   */
  connect = async (
    config: IUsbDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IUsbConnectionResult> => {
    return this.withDisconnectCallback(onDisconnect, async () => {
      const device = await navigator.usb.requestDevice({
        // TODO: remove comment on release, need all devices for test now
        filters: [
          //config
        ],
      });

      logsM.success(
        `${LOG_PREFIX} Устройство выбрано: "${device.productName ?? "Без имени"}" (VID=${device.vendorId}, PID=${device.productId}).`,
      );

      if (!this.isOperationActive()) {
        throw new DOMException("Подключение отменено.", "AbortError");
      }

      this.device = device;
      logsM.info(`${LOG_PREFIX} Открытие USB-устройства.`);
      await this.configureWebUsbDevice(device);

      if (!this.isOperationActive()) {
        await this.cleanupTransport();
        throw new DOMException("Подключение отменено.", "AbortError");
      }
      navigator.usb.addEventListener("disconnect", this.handleDisconnect);
      logsM.info(`${LOG_PREFIX} Listener отключения зарегистрирован.`);

      const batteryLevel = await this.getBatteryLevel();

      return {
        device: {
          manufacturerName: device.manufacturerName,
          productName: device.productName,
          vendorId: device.vendorId,
          productId: device.productId,
          configuration: device.configuration,
        },
        batteryAvailable: this.batteryAvailable,
        batteryLevel,
      };
    });
  };

  /**
   * Читает заряд через vendor-specific control transfer.
   *
   * @returns заряд в процентах или `null`, если интерфейс не захвачен,
   * ответ пустой либо устройство не поддерживает запрос;
   */
  getBatteryLevel = async () => {
    this.batteryAvailable = false;
    if (!this.device || !this.isInterfaceClaimed) return null;

    try {
      logsM.info(`${LOG_PREFIX} Чтение уровня заряда батареи.`);
      const result = await this.device.controlTransferIn(
        CUSTOM_BATTERY_REQUEST,
        BATTERY_RESPONSE_LENGTH,
      );

      if (result.status === "ok" && result.data && result.data.byteLength > 0) {
        const level = result.data.getUint8(0);
        this.batteryAvailable = true;
        logsM.success(`${LOG_PREFIX} Заряд батареи: ${level}%.`);
        return level;
      }
    } catch (error) {
      logsM.error(`${LOG_PREFIX} Ошибка при чтении заряда устройства.`, error);
    }
    return null;
  };

  /** Открывает устройство, выбирает конфигурацию и пытается захватить интерфейс. */
  private readonly configureWebUsbDevice = async (device: USBDevice) => {
    await device.open();
    logsM.info(`${LOG_PREFIX} USB-устройство открыто.`);
    try {
      if (device.configuration?.configurationValue !== DEFAULT_CONFIGURATION) {
        await device.selectConfiguration(DEFAULT_CONFIGURATION);
        logsM.info(
          `${LOG_PREFIX} Выбрана USB-конфигурация: ${DEFAULT_CONFIGURATION}.`,
        );
      }
    } catch (err) {
      await device.close().catch(() => {});
      throw err;
    }

    try {
      await device.claimInterface(DEFAULT_INTERFACE);
      this.isInterfaceClaimed = true;
      logsM.success(
        `${LOG_PREFIX} USB-интерфейс захвачен: ${DEFAULT_INTERFACE}.`,
      );
    } catch {
      this.isInterfaceClaimed = false;
      logsM.warn(
        `${LOG_PREFIX} Интерфейс занят ОС или заблокирован браузером. Продолжаем в режиме чтения метаданных.`,
      );
    }
  };

  /** Передаёт физическое отключение выбранного устройства в общий lifecycle. */
  private readonly handleDisconnect = (event: USBConnectionEvent) => {
    if (this.device && event.device === this.device) {
      logsM.warn(`${LOG_PREFIX} Устройство отключено системой.`);
      this.notifyDisconnected();
    }
  };

  /** Снимает browser listener перед закрытием USB-устройства. */
  protected override readonly beforeDisconnect = () => {
    navigator.usb.removeEventListener("disconnect", this.handleDisconnect);
    logsM.info(`${LOG_PREFIX} Listener отключения снят.`);
  };

  /** Закрывает WebUSB-устройство и очищает локальное состояние стратегии. */
  protected override readonly doDisconnect = async () => {
    const deviceToClose = this.device;
    this.device = null;
    this.isInterfaceClaimed = false;
    this.batteryAvailable = false;

    if (deviceToClose) {
      logsM.info(`${LOG_PREFIX} Закрытие USB-устройства.`);
      await deviceToClose.close().catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (
          !errorMessage.includes("disconnected") &&
          !errorMessage.includes("NotFound")
        ) {
          logsM.error(`${LOG_PREFIX} Ошибка при закрытии USB-устройства.`, err);
        }
      });
      logsM.success(`${LOG_PREFIX} USB-устройство закрыто.`);
    }
  };
}
