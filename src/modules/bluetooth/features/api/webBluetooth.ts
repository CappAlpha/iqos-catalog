import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";

import { COMMON_SERVICES, UUIDS } from "../model/constants";
import type { IBluetooth, BluetoothConnectionResult } from "../model/types";

const readCharacteristic = async (
  device: BluetoothDevice,
  serviceUuid: string,
  characteristicUuid: string,
  errorLabel: string,
) => {
  if (!device.gatt?.connected) {
    console.warn(errorLabel, "GATT-сервер не подключен.");
    return null;
  }

  try {
    const service = await device.gatt.getPrimaryService(serviceUuid);
    const characteristic = await service.getCharacteristic(characteristicUuid);
    return (await characteristic.readValue()) ?? null;
  } catch (error) {
    console.warn(errorLabel, error);
    return null;
  }
};

const getDeviceBattery = async (device: BluetoothDevice) => {
  const value = await readCharacteristic(
    device,
    UUIDS.BATTERY_SERVICE,
    UUIDS.BATTERY_CHARACTERISTIC,
    "Не удалось прочитать заряд батареи Bluetooth-устройства:",
  );
  return value?.getUint8(0) ?? null;
};

export class WebBluetooth implements IBluetooth {
  private device: BluetoothDevice | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  connect = async (
    targetServiceUuid: string,
    _fallbackName: string,
    onDisconnect: () => void,
  ): Promise<BluetoothConnectionResult> => {
    if (typeof navigator === "undefined" || !navigator.bluetooth) {
      throw new Error(
        "Web Bluetooth не поддерживается вашей платформой или браузером.",
      );
    }

    const optionalServices = Array.from(
      new Set([...COMMON_SERVICES, targetServiceUuid]),
    );

    const selectedDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices,
    });

    const gatt = selectedDevice.gatt;
    if (!gatt) {
      throw new Error("GATT-сервер недоступен на этом устройстве.");
    }

    this.device = selectedDevice;
    this.onDisconnectCallback = onDisconnect;
    this.device.addEventListener(
      "gattserverdisconnected",
      this.handleDisconnect,
    );

    try {
      await actionPromiseWithTimeout(
        gatt.connect(),
        10000,
        "Превышено время ожидания ответа от устройства (таймаут).",
      );
    } catch (err) {
      this.cleanup();
      throw err;
    }

    const servicesList: string[] = [];
    const commonServices: readonly string[] = COMMON_SERVICES;

    try {
      if (gatt.connected) {
        const activeServices = await gatt.getPrimaryServices();
        for (const service of activeServices) {
          if (commonServices.includes(service.uuid)) {
            servicesList.push(service.uuid);
          }
        }
      }
    } catch (error) {
      console.warn("Не удалось получить список сервисов устройства:", error);
    }

    const battery = await getDeviceBattery(selectedDevice);

    return {
      services: servicesList,
      batteryLevel: battery,
      device: selectedDevice,
    };
  };

  disconnect = () => {
    this.cleanup();
    return Promise.resolve();
  };

  getBatteryLevel = async () => {
    if (!this.device?.gatt?.connected) return null;
    return getDeviceBattery(this.device);
  };

  private readonly cleanup = () => {
    if (this.device) {
      this.device.removeEventListener(
        "gattserverdisconnected",
        this.handleDisconnect,
      );
      this.device.gatt?.disconnect();
      this.device = null;
    }
    this.onDisconnectCallback = null;
  };

  private readonly handleDisconnect = () => {
    this.onDisconnectCallback?.();
    this.cleanup();
  };
}
