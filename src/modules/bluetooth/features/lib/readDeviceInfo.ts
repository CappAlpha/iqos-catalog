import { DEVICE_INFO } from "../model/constants";
import type { IBluetoothDeviceInfo } from "../model/types";

type TReadChar = (
  serviceUuid: string,
  charUuid: string,
) => Promise<string | null>;

const EMPTY_DEVICE_INFO: IBluetoothDeviceInfo = {
  manufacturerName: null,
  modelNumber: null,
  serialNumber: null,
  hardwareRevision: null,
  firmwareRevision: null,
  softwareRevision: null,
};

export const readDeviceInfo = async (
  read: TReadChar,
): Promise<IBluetoothDeviceInfo> => {
  const s = DEVICE_INFO.SERVICE;

  const manufacturerName = await read(s, DEVICE_INFO.MANUFACTURER_NAME);
  const modelNumber = await read(s, DEVICE_INFO.MODEL_NUMBER);
  const serialNumber = await read(s, DEVICE_INFO.SERIAL_NUMBER);
  const hardwareRevision = await read(s, DEVICE_INFO.HARDWARE_REVISION);
  const firmwareRevision = await read(s, DEVICE_INFO.FIRMWARE_REVISION);
  const softwareRevision = await read(s, DEVICE_INFO.SOFTWARE_REVISION);

  return {
    manufacturerName,
    modelNumber,
    serialNumber,
    hardwareRevision,
    firmwareRevision,
    softwareRevision,
  };
};

export const getEmptyDeviceInfo = (): IBluetoothDeviceInfo => ({
  ...EMPTY_DEVICE_INFO,
});
