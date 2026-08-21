import { IS_ANDROID } from "@/shared/config/platform";

import type { IUsbStrategy } from "../model/types";

type TUsbStrategyFactory = () => IUsbStrategy;

let strategyFactoryPromise: Promise<TUsbStrategyFactory> | null = null;

const createStrategyFactory = async (): Promise<TUsbStrategyFactory> => {
  if (IS_ANDROID) {
    const { AndroidNativeUsb } = await import("../api/androidNativeUsb");
    return () => new AndroidNativeUsb();
  }

  const { WebUsb } = await import("../api/webUsb");
  return () => new WebUsb();
};

export const getUsbStrategy = async (): Promise<IUsbStrategy> => {
  strategyFactoryPromise ??= createStrategyFactory().catch((error: unknown) => {
    strategyFactoryPromise = null;
    throw error;
  });

  const createStrategy = await strategyFactoryPromise;
  return createStrategy();
};
