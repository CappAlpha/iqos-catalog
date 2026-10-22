import { USB_SUPPORT } from "@/shared/config/platform";

import { UNSUPPORTED_MESSAGE } from "../model/constants";
import type { IUsbStrategy } from "../model/types";

export const getUsbStrategy = async (): Promise<IUsbStrategy> => {
  switch (USB_SUPPORT.transport) {
    case "native":
      return new (await import("../api/androidNativeUsb")).AndroidNativeUsb();
    case "web":
      return new (await import("../api/webUsb")).WebUsb();
    default:
      throw new Error(UNSUPPORTED_MESSAGE);
  }
};
