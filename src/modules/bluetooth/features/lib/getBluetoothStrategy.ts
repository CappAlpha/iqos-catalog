import { IS_ANDROID, IS_IOS } from "@/shared/config/platform";

import type { IBluetoothStrategy } from "../model/types";

let bleClientInitialization: Promise<void> | null = null;

const initializeBleClient = async (): Promise<void> => {
  bleClientInitialization ??= import("@capacitor-community/bluetooth-le")
    .then(({ BleClient }) =>
      BleClient.initialize({ androidNeverForLocation: true }),
    )
    .catch((error: unknown) => {
      bleClientInitialization = null;
      throw error;
    });

  await bleClientInitialization;
};

export const getBluetoothStrategy = async (): Promise<IBluetoothStrategy> => {
  if (IS_ANDROID || IS_IOS) {
    await initializeBleClient();
  }

  return IS_ANDROID || IS_IOS
    ? new (await import("../api/nativeBluetooth")).NativeBluetooth()
    : new (await import("../api/webBluetooth")).WebBluetooth();
};
