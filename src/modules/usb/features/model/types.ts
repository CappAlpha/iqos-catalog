export interface IUsbConnectionResult {
  device: USBDevice | null;
  batteryLevel: number | null;
}

export interface IUsbDeviceConfig {
  vendorId?: number;
  productId?: number;
}

export interface IUsbStrategy {
  connect(
    config: IUsbDeviceConfig,
    onDisconnect: () => void,
  ): Promise<IUsbConnectionResult>;
  disconnect(): Promise<void>;
  getBatteryLevel(): Promise<number | null>;
}
