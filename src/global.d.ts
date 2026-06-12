import type { FunctionComponent, SVGProps } from "react";

export {};

declare global {
  interface AndroidBridge {
    connectBluetoothDevice?(serviceUuid: string): void;
    connectUsbDevice?(vendorId: number, productId: number): void;
    disconnect?(): void;
    getBatteryLevel?(): number;
  }

  type IconType = FunctionComponent<
    SVGProps<SVGSVGElement> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
    }
  >;

  var AndroidBridge: AndroidBridge | undefined;
  var onAndroidBluetoothDisconnect: (() => void) | null | undefined;
}
