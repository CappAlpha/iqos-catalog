import type { TDeviceSupport } from "./types";

const cap = globalThis.window?.Capacitor;

export const IS_CAPACITOR = !!cap && cap.isNativePlatform();
export const IS_IOS = IS_CAPACITOR && cap?.getPlatform?.() === "ios";
export const IS_ANDROID = IS_CAPACITOR && cap?.getPlatform?.() === "android";

const getDeviceSupport = (
  nativePlatformSupported: boolean,
  plugin: string,
  webApiSupported: boolean,
): TDeviceSupport => {
  if (IS_CAPACITOR) {
    if (!nativePlatformSupported) {
      return {
        transport: null,
        unavailableReason: "native-platform-unsupported",
      };
    }

    return cap?.isPluginAvailable?.(plugin)
      ? { transport: "native", unavailableReason: null }
      : { transport: null, unavailableReason: "native-plugin-unavailable" };
  }

  return webApiSupported
    ? { transport: "web", unavailableReason: null }
    : { transport: null, unavailableReason: "web-api-unavailable" };
};

export const USB_SUPPORT = getDeviceSupport(
  IS_ANDROID,
  "UsbSerial",
  typeof navigator !== "undefined" && !!navigator.usb,
);

export const BLUETOOTH_SUPPORT = getDeviceSupport(
  IS_ANDROID || IS_IOS,
  "BluetoothLe",
  typeof navigator !== "undefined" && !!navigator.bluetooth,
);
