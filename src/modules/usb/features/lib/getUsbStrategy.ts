import { IS_ANDROID } from "@/shared/constants/constants";

import { AndroidNativeUsb } from "../api/androidNativeUsb";
import { WebUsb } from "../api/webUsb";
import type { IUsbStrategy } from "../model/types";

let USB_INSTANCE: IUsbStrategy | null = null;

export const getUsbStrategy = (): IUsbStrategy => {
  USB_INSTANCE ??= IS_ANDROID ? new AndroidNativeUsb() : new WebUsb();

  return USB_INSTANCE;
};
