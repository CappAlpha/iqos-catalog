const cap = globalThis.window ? globalThis.window?.Capacitor : undefined;

export const IS_CAPACITOR: boolean =
  !!cap && (cap.isNativePlatform?.() ?? false);
export const IS_WEB: boolean = !IS_CAPACITOR;
export const IS_IOS: boolean = IS_CAPACITOR && cap?.getPlatform?.() === "ios";
export const IS_ANDROID: boolean =
  IS_CAPACITOR && cap?.getPlatform?.() === "android";

export const IS_PLUGIN_AVAILABLE_USB: boolean =
  IS_CAPACITOR && (cap?.isPluginAvailable?.("UsbSerial") ?? false);
export const IS_PLUGIN_AVAILABLE_BLUETOOTH: boolean =
  IS_CAPACITOR && (cap?.isPluginAvailable?.("BluetoothLe") ?? false);

export const IS_WEB_SUPPORTED =
  typeof navigator !== "undefined" && !!navigator.usb;
