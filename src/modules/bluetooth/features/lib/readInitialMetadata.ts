import { GAP } from "../model/constants";
import type { IBluetoothDeviceInfo } from "../model/types";
import { getEmptyDeviceInfo, readDeviceInfo } from "./readDeviceInfo";

export interface IInitialMetadataResult {
  deviceName: string | null;
  deviceInfo: IBluetoothDeviceInfo;
  batteryLevel: number | null;
}

export async function readInitialMetadata(
  readChar: (service: string, characteristic: string) => Promise<string | null>,
  getBatteryLevelFn: () => Promise<number | null>,
  fallbackName: string | null,
  signal?: AbortSignal,
): Promise<IInitialMetadataResult> {
  const [nameResult, infoResult, batteryResult] = await Promise.allSettled([
    readChar(GAP.SERVICE, GAP.DEVICE_NAME),
    readDeviceInfo(readChar),
    getBatteryLevelFn(),
  ]);

  signal?.throwIfAborted();

  let connectedName: string | null = null;
  if (
    nameResult.status === "fulfilled" &&
    typeof nameResult.value === "string"
  ) {
    connectedName = nameResult.value;
  }

  const deviceName = connectedName ?? fallbackName;

  let deviceInfo = getEmptyDeviceInfo();
  if (
    infoResult.status === "fulfilled" &&
    infoResult.value.manufacturerName !== null
  ) {
    deviceInfo = infoResult.value;
  }

  let batteryLevel: number | null = null;
  if (batteryResult.status === "fulfilled" && batteryResult.value !== null) {
    batteryLevel = batteryResult.value;
  }

  return { deviceName, deviceInfo, batteryLevel };
}
