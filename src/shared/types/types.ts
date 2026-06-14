export interface IAndroidBridgePlugin {
  connectUsbDevice(options: {
    vendorId: number;
    productId: number;
  }): Promise<void>;
  getUsbDeviceInfo(options: { vendorId: number; productId: number }): Promise<{
    vendorId: number;
    productId: number;
    productName?: string;
    manufacturerName?: string;
    serialNumber?: string;
  }>;

  connectBluetoothDevice(options: { serviceUuid: string }): Promise<void>;
  getBluetoothDeviceInfo(): Promise<{
    name?: string;
    address?: string;
    services?: string[];
  }>;

  getBatteryLevel(): Promise<{ level: number | null }>;
  disconnect(): Promise<void>;
}
