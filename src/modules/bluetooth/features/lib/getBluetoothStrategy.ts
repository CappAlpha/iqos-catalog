import { IS_ANDROID, IS_IOS } from "@/shared/config/platform";

import type { IBluetoothStrategy } from "../model/types";

let isBleClientInitialized = false;

export const getBluetoothStrategy = async (): Promise<IBluetoothStrategy> => {
  if (IS_ANDROID || IS_IOS) {
    const { NativeBluetooth } = await import("../api/nativeBluetooth");

    if (!isBleClientInitialized) {
      const { BleClient } = await import("@capacitor-community/bluetooth-le");
      await BleClient.initialize({ androidNeverForLocation: true });
      isBleClientInitialized = true;
    }

    return new NativeBluetooth();
  } else {
    const { WebBluetooth } = await import("../api/webBluetooth");
    return new WebBluetooth();
  }
};
