import { Capacitor } from "@capacitor/core";

const PLATFORM = Capacitor.getPlatform();
export const IS_WEB = PLATFORM === "web";
export const IS_IOS = PLATFORM === "ios";
export const IS_ANDROID = PLATFORM === "android";
