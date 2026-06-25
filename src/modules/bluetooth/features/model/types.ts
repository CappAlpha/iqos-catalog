export interface IBluetoothDeviceInfo {
  manufacturerName: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  hardwareRevision: string | null;
  firmwareRevision: string | null;
  softwareRevision: string | null;
}

export interface IBluetoothConnectionResult {
  device: Partial<BluetoothDevice> | null;
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
  ): Promise<IBluetoothConnectionResult>;
  disconnect(): Promise<void>;
  getBatteryLevel(): Promise<number | null>;
}
