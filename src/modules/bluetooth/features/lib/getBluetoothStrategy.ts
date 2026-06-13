import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";

import { AndroidNativeBluetooth } from "../api/androidNativeBluetooth";
import { WebBluetooth } from "../api/webBluetooth";
import type { IBluetoothStrategy } from "../model/types";

let BLUETOOTH_INSTANCE: IBluetoothStrategy | null = null;

export const getBluetoothStrategy = () => {
  if (!BLUETOOTH_INSTANCE) {
    const isAndroid = !!getAndroidBridge()?.connectBluetoothDevice;
    BLUETOOTH_INSTANCE = isAndroid
      ? new AndroidNativeBluetooth()
      : new WebBluetooth();
  }

  return BLUETOOTH_INSTANCE;
};
