import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";

import { SERVICE_UUIDS, BATTERY_CHARACTERISTIC } from "../model/constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

export class WebBluetooth implements IBluetoothStrategy {
  private device: BluetoothDevice | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  connect = async (
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IBluetoothConnectionResult> => {
    this.cleanup();

    const selectedDevice = await navigator.bluetooth.requestDevice({
      // TODO: remove comment and acceptAllDevices on release
      // filters: [{ services: config.services }],
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUIDS.BATTERY_SERVICE, ...config.services],
    });

    const gatt = selectedDevice.gatt;
    if (!gatt) {
      console.warn("Не удалось получить GATT устройства:", selectedDevice.name);
      return {
        services: [],
        batteryLevel: null,
        device: selectedDevice,
      };
    }

    this.device = selectedDevice;
    this.onDisconnectCallback = onDisconnect;

    try {
      await actionPromiseWithTimeout(
        gatt.connect(),
        10000,
        "Превышено время ожидания ответа от устройства (таймаут GATT).",
      );
    } catch (err) {
      this.cleanup();
      throw err;
    }

    this.device.addEventListener(
      "gattserverdisconnected",
      this.handleDisconnect,
    );

    const batteryLevel = await this.getBatteryLevel();

    let services: string[] = [];
    try {
      const activeServices = await gatt.getPrimaryServices();
      services = activeServices
        .map((service) => service.uuid)
        .filter((uuid) => config.services.includes(uuid));

      console.log("Получен список сервисов устройства:", services);
    } catch (error) {
      console.warn("Не удалось получить список сервисов устройства:", error);
    }

    return {
      services,
      batteryLevel,
      device: selectedDevice,
    };
  };

  disconnect = () => {
    this.cleanup();
    return Promise.resolve();
  };

  getBatteryLevel = async () => {
    return this.getDeviceBattery(this.device?.gatt);
  };

  private readonly getDeviceBattery = async (
    gatt: BluetoothRemoteGATTServer | undefined,
  ) => {
    if (!gatt?.connected) return null;
    try {
      const service = await gatt.getPrimaryService(
        SERVICE_UUIDS.BATTERY_SERVICE,
      );
      const characteristic = await service.getCharacteristic(
        BATTERY_CHARACTERISTIC,
      );
      const value = await characteristic.readValue();
      return value.getUint8(0);
    } catch (error) {
      console.warn("Ошибка при чтении заряда устройства:", error);
      return null;
    }
  };

  private readonly handleDisconnect = () => {
    const callback = this.onDisconnectCallback;
    this.cleanup();
    callback?.();
  };

  private readonly cleanup = () => {
    if (this.device) {
      this.device.removeEventListener(
        "gattserverdisconnected",
        this.handleDisconnect,
      );
      if (this.device.gatt?.connected) {
        this.device.gatt.disconnect();
      }
      this.device = null;
    }
    this.onDisconnectCallback = null;
  };
}
