import { logsM } from "@/shared/lib/logger";
import { normalizeBatteryLevel } from "@/shared/lib/normalizeBatteryLevel";

import { GAP } from "../model/constants";
import type {
  IBluetoothConnectionResult,
  IBluetoothDeviceInfo,
} from "../model/types";
import { createCharReader } from "./readCharacteristic";
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
  signal?.throwIfAborted();

  const nameResult = await settle(readChar(GAP.SERVICE, GAP.DEVICE_NAME));
  const infoResult = await settle(readDeviceInfo(readChar));
  const batteryResult = await settle(getBatteryLevelFn());

  signal?.throwIfAborted();

  const gapName = normalizeName(
    nameResult.status === "fulfilled" ? nameResult.value : null,
  );
  const fallback = normalizeName(fallbackName);
  const deviceName = gapName ?? fallback;

  if (!deviceName) {
    logsM.warn(
      "[BLE] Имя устройства не получено: GAP.DeviceName и окно выбора пусты.",
    );
  }

  const deviceInfo =
    infoResult.status === "fulfilled" ? infoResult.value : getEmptyDeviceInfo();

  const batteryLevel = normalizeBatteryLevel(
    batteryResult.status === "fulfilled" ? batteryResult.value : null,
  );

  return { deviceName, deviceInfo, batteryLevel };
}

/**
 * Читает имя, метаданные Device Information и заряд батареи, собирая
 * итоговый результат подключения.
 *
 * Отсутствие отдельных BLE-характеристик не отменяет подключение:
 * такие ошибки преобразуются в `null` внутри `readInitialMetadata`.
 *
 * @param deviceId идентификатор устройства, полученный от транспорта;
 * @param fallbackName имя из окна выбора, если GAP.DeviceName недоступен;
 * @param readRaw platform-specific чтение сырого значения характеристики;
 * @param getBatteryLevelFn чтение заряда батареи конкретным транспортом;
 * @param signal сигнал отмены текущей операции от стора;
 */
export const readConnectionData = async (
  deviceId: string,
  fallbackName: string | null,
  readRaw: (serviceUuid: string, charUuid: string) => Promise<DataView>,
  getBatteryLevelFn: () => Promise<number | null>,
  signal?: AbortSignal,
): Promise<IBluetoothConnectionResult> => {
  const read = createCharReader(readRaw);

  const { deviceName, deviceInfo, batteryLevel } = await readInitialMetadata(
    read,
    getBatteryLevelFn,
    fallbackName,
    signal,
  );

  return {
    device: { id: deviceId, name: deviceName },
    deviceInfo,
    batteryLevel,
  };
};
