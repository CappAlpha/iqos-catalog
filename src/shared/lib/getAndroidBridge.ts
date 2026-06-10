export const getAndroidBridge = () => {
  if (typeof globalThis !== "undefined" && globalThis.AndroidBridge) {
    return globalThis.AndroidBridge;
  }
  return undefined;
};
