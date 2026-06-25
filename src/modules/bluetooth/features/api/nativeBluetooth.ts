import { BleClient } from "@capacitor-community/bluetooth-le";

import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { readStringSafely } from "../lib/readCharacteristic";
import { readDeviceInfo } from "../lib/readDeviceInfo";
import { GAP, BATTERY } from "../model/constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

const readChar =
  (deviceId: string) => (serviceUuid: string, charUuid: string) =>
    readStringSafely(() => BleClient.read(deviceId, serviceUuid, charUuid));

export class NativeBluetooth implements IBluetoothStrategy {
  private deviceId: string | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private isDisconnecting = false;

  connect = async (
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IBluetoothConnectionResult> => {
    try {
      await BleClient.initialize({ androidNeverForLocation: true });

      const isBluetoothEnabled = await BleClient.isEnabled();
      if (!isBluetoothEnabled) {
        await BleClient.requestEnable();
      }

      const device = await BleClient.requestDevice({
        // TODO: remove comment on release
        // services: config.services,
        optionalServices: [BATTERY.SERVICE, ...config.services],
      });

      this.deviceId = device.deviceId;
      this.onDisconnectCallback = onDisconnect;

      await BleClient.connect(device.deviceId, () => {
        void this.handleDisconnect();
      });

      const read = readChar(device.deviceId);
      const [batteryLevel, deviceInfo, connectedName] = await Promise.all([
        this.getBatteryLevel(),
        readDeviceInfo(read),
        read(GAP.SERVICE, GAP.DEVICE_NAME),
      ]);

      return {
        device: { id: device.deviceId, name: connectedName || device.name },
        batteryLevel,
        deviceInfo,
      };
    } catch (error) {
      await this.cleanup(false);
      const message = getErrorMessage(
        error,
        "Не удалось подключиться через Bluetooth.",
      );
      throw new Error(message, { cause: error });
    }
  };

  disconnect = async () => {
    await this.cleanup(true);
  };

  getBatteryLevel = async () => {
    if (!this.deviceId) return null;

    try {
      const batteryLevel = await BleClient.read(
        this.deviceId,
        BATTERY.SERVICE,
        BATTERY.LEVEL,
      );

      if (batteryLevel.byteLength === 0) return null;
      return batteryLevel.getUint8(0);
    } catch (error) {
      console.warn("Ошибка при чтении заряда батареи:", error);
      return null;
    }
  };

  private readonly cleanup = async (triggerCallback = false) => {
    if (this.isDisconnecting) return;
    this.isDisconnecting = true;

    const callback = this.onDisconnectCallback;
    const idToDisconnect = this.deviceId;
    const wasConnected = !!idToDisconnect;

    this.deviceId = null;
    this.onDisconnectCallback = null;

    if (idToDisconnect) {
      try {
        await BleClient.disconnect(idToDisconnect);
      } catch (err) {
        console.warn("Ошибка при закрытии соединения Bluetooth:", err);
      }
    }

    this.isDisconnecting = false;

    if (triggerCallback && wasConnected) {
      callback?.();
    }
  };

  private readonly handleDisconnect = async () => {
    if (this.isDisconnecting) return;
    await this.cleanup(true);
  };
}
