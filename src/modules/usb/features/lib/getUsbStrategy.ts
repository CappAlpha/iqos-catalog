import { IS_ANDROID } from "@/shared/config/platform";

import type { IUsbStrategy } from "../model/types";

export const getUsbStrategy = async (): Promise<IUsbStrategy> => {
  if (IS_ANDROID) {
    const { AndroidNativeUsb } = await import("../api/androidNativeUsb");
    return new AndroidNativeUsb();
  } else {
    const { WebUsb } = await import("../api/webUsb");
    return new WebUsb();
  }
};
