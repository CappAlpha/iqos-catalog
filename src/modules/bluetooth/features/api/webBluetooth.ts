import { actionPromiseWithTimeout } from "@/shared/lib/actionPromiseWithTimeout";

import { COMMON_SERVICES, UUIDS } from "../model/constants";
import type { IBluetooth, BluetoothConnectionResult } from "../model/types";

const GENERIC_NAME_REGEX = /unknown|неизвестн|unsupported/i;

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

const fetchGAPDeviceName = async (
  device: BluetoothDevice,
): Promise<string | null> => {
  const value = await readCharacteristic(
    device,
    UUIDS.GAP_SERVICE,
    UUIDS.GAP_DEVICE_NAME,
    "Не удалось прочитать имя устройства из GAP:",
  );
  return value ? new TextDecoder().decode(value).trim() : null;
};

export class WebBluetooth implements IBluetooth {
  private device: BluetoothDevice | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  connect = async (
    targetServiceUuid: string,
    fallbackName: string,
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
    let deviceName = selectedDevice.name ?? "Неизвестное устройство";

    if (!selectedDevice.name || GENERIC_NAME_REGEX.test(selectedDevice.name)) {
      deviceName = (await fetchGAPDeviceName(selectedDevice)) ?? deviceName;
    }

    return {
      deviceName,
      services: servicesList,
      batteryLevel: battery,
      deviceId: selectedDevice.id,
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
