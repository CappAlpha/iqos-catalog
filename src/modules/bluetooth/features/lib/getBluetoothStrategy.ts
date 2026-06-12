import { getAndroidBridge } from "@/shared/lib/getAndroidBridge";

import { NativeBluetooth } from "../api/nativeBluetooth";
import { WebBluetooth } from "../api/webBluetooth";
import type { IBluetooth } from "../model/types";

let bluetoothInstance: IBluetooth | null = null;

export const getBluetoothStrategy = (): IBluetooth => {
  if (!bluetoothInstance) {
    const isAndroid = !!getAndroidBridge()?.connectBluetoothDevice;
    bluetoothInstance = isAndroid ? new NativeBluetooth() : new WebBluetooth();
  }

  return bluetoothInstance;
};
