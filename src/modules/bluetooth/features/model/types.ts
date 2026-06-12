export type BluetoothConnectionResult = {
  deviceName: string;
  services: string[];
  batteryLevel: number | null;
  deviceId?: string;
};

export interface IBluetooth {
  connect(
    targetServiceUuid: string,
    fallbackName: string,
    onDisconnect?: () => void,
  ): Promise<BluetoothConnectionResult>;
  disconnect(): Promise<void>;
  getBatteryLevel(): Promise<number | null>;
}
