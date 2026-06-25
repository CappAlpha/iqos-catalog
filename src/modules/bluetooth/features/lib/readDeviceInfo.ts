import { DEVICE_INFO } from "../model/constants";
import type { IBluetoothDeviceInfo } from "../model/types";

type ReadChar = (
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
  read: ReadChar,
): Promise<IBluetoothDeviceInfo> => {
  const s = DEVICE_INFO.SERVICE;

  const [
    manufacturerName,
    modelNumber,
    serialNumber,
    hardwareRevision,
    firmwareRevision,
    softwareRevision,
  ] = await Promise.all([
    read(s, DEVICE_INFO.MANUFACTURER_NAME),
    read(s, DEVICE_INFO.MODEL_NUMBER),
    read(s, DEVICE_INFO.SERIAL_NUMBER),
    read(s, DEVICE_INFO.HARDWARE_REVISION),
    read(s, DEVICE_INFO.FIRMWARE_REVISION),
    read(s, DEVICE_INFO.SOFTWARE_REVISION),
  ]);

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
