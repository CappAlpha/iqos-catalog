import { IS_ANDROID, IS_IOS } from "@/shared/constants/constants";

import { NativeBluetooth } from "../api/nativeBluetooth";
import { WebBluetooth } from "../api/webBluetooth";
import type { IBluetoothStrategy } from "../model/types";

let BLUETOOTH_INSTANCE: IBluetoothStrategy | null = null;

export const getBluetoothStrategy = (): IBluetoothStrategy => {
  BLUETOOTH_INSTANCE ??=
    IS_ANDROID || IS_IOS ? new NativeBluetooth() : new WebBluetooth();

  return BLUETOOTH_INSTANCE;
};
