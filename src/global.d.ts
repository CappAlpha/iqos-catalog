export {};

declare global {
  interface AndroidBridge {
    connectBluetoothDevice?(serviceUuid: string): void;
    connectUsbDevice?(vendorId: number, productId: number): void;
    disconnect?(): void;
    getBatteryLevel?(): number;
  }

  var AndroidBridge: AndroidBridge | undefined;
  var onAndroidBluetoothDisconnect: (() => void) | null | undefined;
}

declare module "*.svg" {
  import { type ComponentType, type SVGProps } from "react";
  const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
