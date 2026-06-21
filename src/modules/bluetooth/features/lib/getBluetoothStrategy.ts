import { IS_ANDROID, IS_IOS } from "@/shared/config/platform";

import type { IBluetoothStrategy } from "../model/types";

let BLUETOOTH_INSTANCE: IBluetoothStrategy | null = null;

export const getBluetoothStrategy = async (): Promise<IBluetoothStrategy> => {
  if (!BLUETOOTH_INSTANCE) {
    if (IS_ANDROID || IS_IOS) {
      const { NativeBluetooth } = await import("../api/nativeBluetooth");
      BLUETOOTH_INSTANCE = new NativeBluetooth();
    } else {
      const { WebBluetooth } = await import("../api/webBluetooth");
      BLUETOOTH_INSTANCE = new WebBluetooth();
    }
  }

  return BLUETOOTH_INSTANCE;
};
