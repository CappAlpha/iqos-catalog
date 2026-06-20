import { BleClient } from "@capacitor-community/bluetooth-le";

import { getErrorMessage } from "@/shared/lib/getErrorMessage";

import { BATTERY_CHARACTERISTIC, SERVICE_UUIDS } from "../model/constants";
import type {
  IBluetoothStrategy,
  IBluetoothConnectionResult,
  IBluetoothDeviceConfig,
} from "../model/types";

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
        optionalServices: [SERVICE_UUIDS.BATTERY_SERVICE],
      });

      this.deviceId = device.deviceId;
      this.onDisconnectCallback = onDisconnect;

      await BleClient.connect(device.deviceId, () => {
        void this.handleDisconnect();
      });

      const batteryLevel = await this.getBatteryLevel();

      let services: string[] = [];
      try {
        if (this.deviceId) {
          const discoveredServices = await BleClient.getServices(
            device.deviceId,
          );
          services = discoveredServices
            .map((s) => s.uuid)
            .filter((uuid) => config.services.includes(uuid));

          console.log("Доступные сервисы устройства:", services);
        }
      } catch (e) {
        console.warn("Не удалось прочитать сервисы устройства:", e);
      }

      return {
        device: { ...device, id: device.deviceId },
        services,
        batteryLevel,
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
        SERVICE_UUIDS.BATTERY_SERVICE,
        BATTERY_CHARACTERISTIC,
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
