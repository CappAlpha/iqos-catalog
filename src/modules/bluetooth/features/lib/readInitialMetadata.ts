import { logsM } from "@/modules/logs/features/model/logsM";

import { GAP } from "../model/constants";
import type { IBluetoothDeviceInfo } from "../model/types";
import { getEmptyDeviceInfo, readDeviceInfo } from "./readDeviceInfo";

export interface IInitialMetadataResult {
  deviceName: string | null;
  deviceInfo: IBluetoothDeviceInfo;
  batteryLevel: number | null;
}

const normalizeName = (name: string | null): string | null =>
  name?.trim() ? name.trim() : null;

const settle = async <T>(
  promise: Promise<T>,
): Promise<PromiseSettledResult<T>> => {
  try {
    return { status: "fulfilled", value: await promise };
  } catch (reason) {
    return { status: "rejected", reason };
  }
};

export async function readInitialMetadata(
  readChar: (service: string, characteristic: string) => Promise<string | null>,
  getBatteryLevelFn: () => Promise<number | null>,
  fallbackName: string | null,
  signal?: AbortSignal,
): Promise<IInitialMetadataResult> {
  const nameResult = await settle(readChar(GAP.SERVICE, GAP.DEVICE_NAME));
  const infoResult = await settle(readDeviceInfo(readChar));
  const batteryResult = await settle(getBatteryLevelFn());

  signal?.throwIfAborted();

  const gapName = normalizeName(
    nameResult.status === "fulfilled" ? nameResult.value : null,
  );
  const fallback = normalizeName(fallbackName);
  const deviceName = gapName ?? fallback;

  if (gapName) {
    logsM.info(`[BLE] Имя из GAP.DeviceName: "${gapName}".`);
  } else if (fallback) {
    logsM.info(
      `[BLE] GAP.DeviceName не прочитано — имя из окна выбора: "${fallback}".`,
    );
  } else {
    logsM.warn(
      "[BLE] Имя устройства не получено: GAP.DeviceName и окно выбора пусты.",
    );
  }

  const deviceInfo =
    infoResult.status === "fulfilled" ? infoResult.value : getEmptyDeviceInfo();

  let batteryLevel: number | null = null;
  if (batteryResult.status === "fulfilled" && batteryResult.value !== null) {
    batteryLevel = batteryResult.value;
  }

  return { deviceName, deviceInfo, batteryLevel };
}
