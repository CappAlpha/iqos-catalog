export const isIOS = (): boolean => {
  if (typeof globalThis === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const isIOSDevice = /iPad|iPhone|iPod/i.test(navigator.userAgent);

  const isIPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  return isIOSDevice || isIPadOS;
};
