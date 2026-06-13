export type IBluetoothConnectionResult = {
  device: BluetoothDevice | null;
  services: string[];
  batteryLevel: number | null;
};

export interface IBluetoothDeviceConfig {
  services: string[];
}

export interface IBluetoothStrategy {
  connect(
    config: IBluetoothDeviceConfig,
    onDisconnect?: () => void,
  ): Promise<IBluetoothConnectionResult>;
  disconnect(): Promise<void>;
  getBatteryLevel(): Promise<number | null>;
}
