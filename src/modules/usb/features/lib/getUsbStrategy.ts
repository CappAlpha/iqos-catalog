import { IS_ANDROID } from "@/shared/config/platform";

import type { IUsbStrategy } from "../model/types";

export const getUsbStrategy = async (): Promise<IUsbStrategy> =>
  IS_ANDROID
    ? new (await import("../api/androidNativeUsb")).AndroidNativeUsb()
    : new (await import("../api/webUsb")).WebUsb();
