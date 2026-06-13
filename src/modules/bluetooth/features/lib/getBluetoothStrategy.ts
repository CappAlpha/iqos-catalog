import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";

import { NativeBluetooth } from "../api/nativeBluetooth";
import { WebBluetooth } from "../api/webBluetooth";
import type { IBluetoothStrategy } from "../model/types";

let BLUETOOTH_INSTANCE: IBluetoothStrategy | null = null;

export const getBluetoothStrategy = () => {
  if (!BLUETOOTH_INSTANCE) {
    const isAndroid = !!getAndroidBridge()?.connectBluetoothDevice;
    BLUETOOTH_INSTANCE = isAndroid ? new NativeBluetooth() : new WebBluetooth();
  }

  return BLUETOOTH_INSTANCE;
};
