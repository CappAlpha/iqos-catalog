import { IS_ANDROID, IS_IOS } from "@/shared/config/platform";

import type { IBluetoothStrategy } from "../model/types";

type TBluetoothStrategyFactory = () => IBluetoothStrategy;

let bleClientInitialization: Promise<void> | null = null;
let strategyFactoryPromise: Promise<TBluetoothStrategyFactory> | null = null;

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

  strategyFactoryPromise ??= (
    IS_ANDROID || IS_IOS
      ? import("../api/nativeBluetooth").then(
          ({ NativeBluetooth }) =>
            () =>
              new NativeBluetooth(),
        )
      : import("../api/webBluetooth").then(
          ({ WebBluetooth }) =>
            () =>
              new WebBluetooth(),
        )
  ).catch((error: unknown) => {
    strategyFactoryPromise = null;
    throw error;
  });

  const createStrategy = await strategyFactoryPromise;
  return createStrategy();
};
