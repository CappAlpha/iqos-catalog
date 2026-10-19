import type { IBluetoothDeviceConfig } from "./types";

export const GAP = {
  SERVICE: "00001800-0000-1000-8000-00805f9b34fb",
  DEVICE_NAME: "00002a00-0000-1000-8000-00805f9b34fb",
} as const;

export const BATTERY = {
  SERVICE: "0000180f-0000-1000-8000-00805f9b34fb",
  LEVEL: "00002a19-0000-1000-8000-00805f9b34fb",
} as const;

export const DEVICE_INFO = {
  SERVICE: "0000180a-0000-1000-8000-00805f9b34fb",
  MANUFACTURER_NAME: "00002a29-0000-1000-8000-00805f9b34fb",
  MODEL_NUMBER: "00002a24-0000-1000-8000-00805f9b34fb",
  SERIAL_NUMBER: "00002a25-0000-1000-8000-00805f9b34fb",
  HARDWARE_REVISION: "00002a27-0000-1000-8000-00805f9b34fb",
  FIRMWARE_REVISION: "00002a26-0000-1000-8000-00805f9b34fb",
  SOFTWARE_REVISION: "00002a28-0000-1000-8000-00805f9b34fb",
} as const;

const DEVICE_CONTROL = {
  SERVICE: "daebb240-b041-11e4-9e45-0002a5d5c51b",
} as const;

export const DEVICE_CONFIG: IBluetoothDeviceConfig = {
  services: [BATTERY.SERVICE, DEVICE_INFO.SERVICE, DEVICE_CONTROL.SERVICE],
};

export const REQUIRED_SERVICES = [
  GAP.SERVICE,
  ...DEVICE_CONFIG.services,
] as const;

export const BLE_CONNECT_TIMEOUT_MS = 20_000;
export const BLE_DISCONNECT_TIMEOUT_MS = 3_000;

export const UNSUPPORTED_MESSAGE =
  "Bluetooth не поддерживается на этой платформе.";

export const CONNECT_TIMEOUT_MESSAGE =
  "Время ожидания подключения истекло. Закройте окно выбора устройств и попробуйте снова.";
export const CONNECT_ERROR_FALLBACK_MESSAGE =
  "Ошибка подключения по Bluetooth.";

export const DEVICE_NOT_SELECTED_ERRORS = [
  "User cancelled the requestDevice() chooser.",
  "User cancelled chooser",
] as readonly string[];

export const CONNECTION_LOST_MESSAGE =
  "Соединение разорвано: устройство отключено или вышло из зоны действия.";

export const DISCONNECT_TIMEOUT_MESSAGE = "Таймаут физического отключения";
export const BATTERY_REFRESH_ERROR_MESSAGE =
  "Не удалось обновить заряд батареи.";
