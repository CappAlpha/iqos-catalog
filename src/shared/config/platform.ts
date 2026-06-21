const cap = globalThis.window ? globalThis.window?.Capacitor : undefined;

export const IS_CAPACITOR = !!cap && cap.isNativePlatform();
export const IS_IOS = IS_CAPACITOR && cap?.getPlatform?.() === "ios";
export const IS_ANDROID = IS_CAPACITOR && cap?.getPlatform?.() === "android";

export const IS_NATIVE_USB_AVAILABLE =
  IS_CAPACITOR && cap?.isPluginAvailable?.("UsbSerial");
export const IS_NATIVE_BLUETOOTH_AVAILABLE =
  IS_CAPACITOR && cap?.isPluginAvailable?.("BluetoothLe");

export const IS_WEB_SUPPORTED =
  typeof navigator !== "undefined" && !!navigator.usb;
