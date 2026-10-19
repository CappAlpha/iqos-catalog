import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";
import { BaseConnectionStrategy } from "@/shared/lib/baseConnectionStrategy";
import { getErrorMessage } from "@/shared/lib/getErrorMessage";
import { logsM } from "@/shared/lib/logger";

import { readConnectionData } from "../lib/readConnectionData";
import { getEmptyDeviceInfo } from "../lib/readDeviceInfo";
import { BATTERY, REQUIRED_SERVICES } from "../model/constants";
import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
  IBluetoothStrategy,
} from "../model/types";

const LOG_PREFIX = "[WebBluetooth]";
const GATT_CONNECT_TIMEOUT = 10_000;

/**
 * Реализация {@link BaseConnectionStrategy} поверх Web Bluetooth API (браузер).
 *
 * Физическое подключение/отключение и чтение характеристик делегируются navigator.bluetooth.
 * Системное событие разрыва приходит через `gattserverdisconnected` и транслируется
 * в `notifyDisconnected()` базового класса.
 */
export class WebBluetooth
  extends BaseConnectionStrategy<
    IBluetoothDeviceConfig,
    IBluetoothConnectionResult
  >
  implements IBluetoothStrategy
{
  protected readonly logPrefix = LOG_PREFIX;
  protected readonly disconnectErrorMessage =
    "Ошибка при разрыве GATT-соединения";

  private device: BluetoothDevice | null = null;

  constructor() {
    super(logsM);
  }

  /**
   * Подключает устройство через Web Bluetooth API.
   *
   * Последовательность операции: выбор устройства в browser chooser, GATT-
   * подключение и чтение начальных metadata через `readConnectionData`.
   * Отсутствие отдельных BLE-характеристик не отменяет подключение:
   * такие ошибки преобразуются в `null` внутри `readInitialMetadata`.
   *
   * @param config конфигурация BLE-сервисов для будущих browser-фильтров;
   * @param onDisconnect callback события `gattserverdisconnected`;
   * @param signal необязательный сигнал отмены операции;
   * @returns идентификатор, имя, metadata и начальный заряд устройства;
   * @throws если chooser отменён, GATT-соединение не установлено или истёк timeout;
   */
  connect = async (
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
    signal?: AbortSignal,
  ): Promise<IBluetoothConnectionResult> => {
    return this.withDisconnectCallback(onDisconnect, async () => {
      const selectedDevice: BluetoothDevice =
        await navigator.bluetooth.requestDevice({
          // TODO: remove comment and acceptAllDevices on release, need all devices for test now
          // filters: [{ services: config.services }],
          acceptAllDevices: true,
          optionalServices: [...REQUIRED_SERVICES],
        });

      if (!this.isOperationActive()) {
        throw new DOMException("Подключение отменено.", "AbortError");
      }

      signal?.throwIfAborted();

      logsM.success(
        `${LOG_PREFIX} Устройство выбрано: "${selectedDevice.name ?? "Без имени"}" (ID: ${selectedDevice.id})`,
      );

      const gatt = selectedDevice.gatt;
      if (!gatt) {
        logsM.warn(
          `${LOG_PREFIX} У устройства "${selectedDevice.name ?? "Без имени"}" нет GATT-сервера.`,
        );
        return {
          device: { id: selectedDevice.id, name: selectedDevice.name ?? null },
          deviceInfo: getEmptyDeviceInfo(),
          batteryLevel: null,
        };
      }

      this.device = selectedDevice;

      await actionPromiseWithTimeout(
        gatt.connect(),
        GATT_CONNECT_TIMEOUT,
        "Превышено время ожидания ответа от устройства (таймаут GATT).",
      );

      if (!this.isOperationActive()) {
        await this.cleanupTransport();
        throw new DOMException("Подключение отменено.", "AbortError");
      }

      signal?.throwIfAborted();

      selectedDevice.addEventListener(
        "gattserverdisconnected",
        this.handleGattDisconnect,
      );

      return readConnectionData(
        selectedDevice.id,
        selectedDevice.name ?? null,
        async (svc, chr) => {
          const service = await gatt.getPrimaryService(svc);
          const characteristic = await service.getCharacteristic(chr);
          return await characteristic.readValue();
        },
        () => this.getBatteryLevel(),
        signal,
      );
    });
  };

  /**
   * Читает Battery Level characteristic через подключённый GATT-сервер.
   *
   * @returns заряд в процентах или `null`, если GATT недоступен, значение пустое
   * либо browser API не смог прочитать characteristic;
   */
  getBatteryLevel = async (): Promise<number | null> => {
    const gatt = this.device?.gatt;
    if (!gatt?.connected) {
      logsM.warn(
        `${LOG_PREFIX} Чтение батареи отклонено: GATT-сервер не подключён.`,
      );
      return null;
    }

    try {
      const service = await gatt.getPrimaryService(BATTERY.SERVICE);
      const characteristic = await service.getCharacteristic(BATTERY.LEVEL);
      const value = await characteristic.readValue();
      if (value.byteLength === 0) {
        logsM.warn(
          `${LOG_PREFIX} Заряд батареи не прочитан: пустой ответ устройства.`,
        );
        return null;
      }
      return value.getUint8(0);
    } catch (err) {
      logsM.warn(
        `${LOG_PREFIX} Ошибка чтения заряда: ${getErrorMessage(err, "неизвестная")}`,
      );
      return null;
    }
  };

  /** Снимает listener GATT перед закрытием Web Bluetooth-соединения. */
  protected override readonly beforeDisconnect = () => {
    if (!this.device) return;
    this.device.removeEventListener(
      "gattserverdisconnected",
      this.handleGattDisconnect,
    );
  };

  /** Закрывает GATT-соединение и очищает ссылку на browser device. */
  protected doDisconnect = () => {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
  };

  /**
   * Системное событие разрыва GATT (gattserverdisconnected). Транслируется в
   * notifyDisconnected() базового класса, который вызовет onDisconnect-колбэк стора.
   */
  private readonly handleGattDisconnect = () => {
    this.notifyDisconnected();
  };
}
