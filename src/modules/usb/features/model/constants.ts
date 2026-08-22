import type { IUsbDeviceConfig } from "./types";

export const USB_CONFIG = {
  vendorId: 10073,
  productId: 3,
} as const satisfies IUsbDeviceConfig;

export const USB_CONNECT_TIMEOUT_MS = 20_000;
export const USB_DISCONNECT_TIMEOUT_MS = 3_000;

export const DEFAULT_CONFIGURATION = 1;
export const DEFAULT_INTERFACE = 0;

// TODO: another value?
export const CUSTOM_BATTERY_REQUEST = {
  requestType: "vendor",
  recipient: "device",
  request: 0x01,
  value: 0x00,
  index: 0x00,
} as const;

export const BATTERY_RESPONSE_LENGTH = 1;

export const UNSUPPORTED_MESSAGE = "USB не поддерживается на этой платформе.";

export const CONNECT_TIMEOUT_MESSAGE =
  "Не удалось подключиться по USB, попробуйте ещё раз.";
export const CONNECT_ERROR_FALLBACK_MESSAGE = "Ошибка подключения по USB.";

export const DEVICE_NOT_SELECTED_ERROR =
  "Failed to execute 'requestDevice' on 'USB': No device selected.";

export const CONNECTION_LOST_MESSAGE =
  "Соединение разорвано: устройство отключено или извлечено из USB-порта.";

export const DISCONNECT_TIMEOUT_MESSAGE = "Таймаут физического отключения";
export const BATTERY_REFRESH_ERROR_MESSAGE =
  "Не удалось обновить заряд батареи.";
