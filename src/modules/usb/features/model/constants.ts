export const USB_CONFIG = {
  VENDOR_ID: 10073,
  PRODUCT_ID: 3,
} as const;

export const DEFAULT_CONFIGURATION = 1;
export const DEFAULT_INTERFACE = 0;

// TODO: another value?
export const CUSTOM_BATTERY_REQUEST = {
  requestType: "vendor" as const,
  recipient: "device" as const,
  request: 0x01,
  value: 0x00,
  index: 0x00,
} as const;

export const BATTERY_RESPONSE_LENGTH = 1;
