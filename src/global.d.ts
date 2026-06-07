export interface AndroidBridge {
  connectBluetoothDevice?(serviceUuid: string): void;
  connectUsbDevice?(vendorId: number, productId: number): void;
  disconnect?(): void;
  getBatteryLevel?(): number;
}

declare global {
  var AndroidBridge: AndroidBridge | undefined;
}

declare module "*.svg" {
  import { type ComponentType, type SVGProps } from "react";
  const ReactComponent: ComponentType<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
