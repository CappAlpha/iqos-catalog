import type { AndroidBridge } from "@/global";

export const getAndroidBridge = (): AndroidBridge | undefined => {
  if (typeof globalThis !== "undefined") {
    return globalThis.AndroidBridge;
  }
  return undefined;
};
