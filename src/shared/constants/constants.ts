import { Capacitor } from "@capacitor/core";

const PLATFORM = Capacitor.getPlatform();
export const IS_WEB = PLATFORM === "web";
export const IS_IOS = PLATFORM === "ios";
export const IS_ANDROID = PLATFORM === "android";

export const IS_CAPACITOR = Capacitor.isNativePlatform();
export const IS_PLUGIN_AVAILABLE_USB = Capacitor.isPluginAvailable("UsbSerial");
export const IS_PLUGIN_AVAILABLE_BLUETOOTH =
  Capacitor.isPluginAvailable("BluetoothLe");

export const IS_WEB_SUPPORTED =
  typeof navigator !== "undefined" && !!navigator.usb;
