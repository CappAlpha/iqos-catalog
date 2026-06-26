import { IS_ANDROID, IS_IOS } from "@/shared/config/platform";

import type { IBluetoothStrategy } from "../model/types";

export const getBluetoothStrategy = async (): Promise<IBluetoothStrategy> => {
  if (IS_ANDROID || IS_IOS) {
    const { NativeBluetooth } = await import("../api/nativeBluetooth");
    return new NativeBluetooth();
  } else {
    const { WebBluetooth } = await import("../api/webBluetooth");
    return new WebBluetooth();
  }
};
