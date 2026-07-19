export interface IBluetoothDeviceInfo {
  manufacturerName: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  hardwareRevision: string | null;
  firmwareRevision: string | null;
  softwareRevision: string | null;
}

export interface IBluetoothDevice {
  id: string;
  name: string | null;
}

export interface IBluetoothConnectionResult {
  device: IBluetoothDevice;
  batteryLevel: number | null;
  deviceInfo: IBluetoothDeviceInfo;
}

export interface IBluetoothDeviceConfig {
  services: string[];
}

export interface IBluetoothStrategy {
  connect(
    config: IBluetoothDeviceConfig,
    onDisconnect: () => void,
    signal?: AbortSignal,
  ): Promise<IBluetoothConnectionResult>;
  disconnect(): Promise<void>;
  getBatteryLevel(): Promise<number | null>;
}
