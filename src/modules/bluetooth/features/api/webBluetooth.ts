import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";

import { readStringSafely } from "../lib/readCharacteristic";
import { readDeviceInfo, getEmptyDeviceInfo } from "../lib/readDeviceInfo";
import { GAP, BATTERY } from "../model/constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

const readChar =
  (gatt: BluetoothRemoteGATTServer) =>
  (serviceUuid: string, charUuid: string) =>
    readStringSafely(async () => {
      const service = await gatt.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(charUuid);
      return characteristic.readValue();
    });

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
      optionalServices: [BATTERY.SERVICE, ...config.services],
    });

    const gatt = selectedDevice.gatt;
    if (!gatt) {
      console.warn("Не удалось получить GATT устройства:", selectedDevice.name);
      return {
        batteryLevel: null,
        device: { id: selectedDevice.id, name: selectedDevice.name },
        deviceInfo: getEmptyDeviceInfo(),
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

    const read = readChar(gatt);
    const [batteryLevel, deviceInfo, connectedName] = await Promise.all([
      this.getBatteryLevel(),
      readDeviceInfo(read),
      read(GAP.SERVICE, GAP.DEVICE_NAME),
    ]);

    return {
      batteryLevel,
      device: {
        id: selectedDevice.id,
        name: connectedName || selectedDevice.name,
      },
      deviceInfo,
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
      const service = await gatt.getPrimaryService(BATTERY.SERVICE);
      const characteristic = await service.getCharacteristic(BATTERY.LEVEL);
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
