import { IS_ANDROID } from "@/shared/config/platform";

import type { IUsbStrategy } from "../model/types";

let USB_INSTANCE: IUsbStrategy | null = null;

export const getUsbStrategy = async (): Promise<IUsbStrategy> => {
  if (!USB_INSTANCE) {
    if (IS_ANDROID) {
      const { AndroidNativeUsb } = await import("../api/androidNativeUsb");
      USB_INSTANCE = new AndroidNativeUsb();
    } else {
      const { WebUsb } = await import("../api/webUsb");
      USB_INSTANCE = new WebUsb();
    }
  }

  return USB_INSTANCE;
};
