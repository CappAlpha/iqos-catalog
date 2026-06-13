import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";

import { NativeUsb } from "../api/nativeUsb";
import { WebUsb } from "../api/webUsb";
import type { IUsbStrategy } from "../model/types";

let USB_INSTANCE: IUsbStrategy | null = null;

export const getUsbStrategy = (): IUsbStrategy => {
  if (!USB_INSTANCE) {
    const isAndroid = !!getAndroidBridge()?.connectUsbDevice;
    USB_INSTANCE = isAndroid ? new NativeUsb() : new WebUsb();
  }

  return USB_INSTANCE;
};
