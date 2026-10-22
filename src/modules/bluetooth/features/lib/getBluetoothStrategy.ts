import { BLUETOOTH_SUPPORT } from "@/shared/config/platform";

import { UNSUPPORTED_MESSAGE } from "../model/constants";
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
  switch (BLUETOOTH_SUPPORT.transport) {
    case "native":
      await initializeBleClient();
      return new (await import("../api/nativeBluetooth")).NativeBluetooth();
    case "web":
      return new (await import("../api/webBluetooth")).WebBluetooth();
    default:
      throw new Error(UNSUPPORTED_MESSAGE);
  }
};
